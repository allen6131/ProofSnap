from __future__ import annotations

import json
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.config import get_settings


class OpenAISpotNotes(BaseModel):
    ramp_id: str
    boating_notes: list[str] = Field(default_factory=list)
    fishing_notes: list[str] = Field(default_factory=list)


class OpenAISummary(BaseModel):
    assistant_message: str
    spot_notes: list[OpenAISpotNotes] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    suggested_followups: list[str] = Field(default_factory=list)
    used_openai: bool = False


def _fallback_summary(context: dict[str, Any]) -> OpenAISummary:
    recommendations = context.get("recommendations", [])
    intent = context.get("intent", "both")
    if not recommendations:
        return OpenAISummary(
            assistant_message=(
                "I could not find enough ramp and conditions data to recommend a spot yet. "
                "Try importing ramps or searching a specific Tampa Bay area."
            ),
            warnings=list(context.get("warnings", [])),
            suggested_followups=[
                "Which saved ramp looks most approachable today?",
                "What data is missing for this recommendation?",
            ],
            used_openai=False,
        )

    top = recommendations[0]
    color = top.get("launch_color", "gray")
    confidence = top.get("confidence_score", 0)
    name = top.get("name", "the top ramp")
    assistant_message = (
        f"Based on the official-source data available to rampready, {name} is the best "
        f"candidate I found for {intent} today. It is currently rated {color} with "
        f"{confidence}% confidence. Review the reasons, missing-data notes, and official "
        "sources before deciding whether to go."
    )
    if intent in {"fishing", "both"}:
        assistant_message += (
            " For fishing, treat this as an access and conditions recommendation only—not a "
            "promise that fish will be biting—and verify current FWC rules."
        )

    return OpenAISummary(
        assistant_message=assistant_message,
        warnings=list(context.get("warnings", [])),
        suggested_followups=[
            "Which window looks safest for a beginner?",
            "What conditions are limiting today?",
            "What official sources should I double-check?",
        ],
        used_openai=False,
    )


def _extract_response_text(payload: dict[str, Any]) -> str | None:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]
    chunks: list[str] = []
    for item in payload.get("output", []) or []:
        for content in item.get("content", []) or []:
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "\n".join(chunks) if chunks else None


async def generate_chat_recommendation_text(context: dict[str, Any]) -> OpenAISummary:
    settings = get_settings()
    if not settings.openai_api_key:
        return _fallback_summary(context)
    if settings.app_env == "test" and not settings.chat_use_openai_in_tests:
        return _fallback_summary(context)

    system_prompt = (
        "You are rampready's boating/fishing planning assistant. Use only the provided JSON "
        "context. Do not invent weather, tide, buoy, water quality, ramp, or fishing facts. "
        "Do not provide navigation directions, emergency guidance, legal advice, or official "
        "government recommendations. Make conservative beginner-friendly explanations. For "
        "fishing, describe access and conditions for trying; never promise fish will bite. "
        "Mention missing, stale, or low-confidence data when relevant. Return only JSON with "
        "assistant_message, spot_notes, warnings, and suggested_followups."
    )
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "assistant_message": {"type": "string"},
            "spot_notes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "ramp_id": {"type": "string"},
                        "boating_notes": {"type": "array", "items": {"type": "string"}},
                        "fishing_notes": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["ramp_id", "boating_notes", "fishing_notes"],
                },
            },
            "warnings": {"type": "array", "items": {"type": "string"}},
            "suggested_followups": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["assistant_message", "spot_notes", "warnings", "suggested_followups"],
    }

    request_payload = {
        "model": settings.openai_model,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(context, default=str)},
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "rampready_chat_recommendation",
                "schema": schema,
                "strict": True,
            }
        },
    }

    try:
        async with httpx.AsyncClient(timeout=settings.chat_openai_timeout_seconds) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json=request_payload,
            )
            response.raise_for_status()
        text = _extract_response_text(response.json())
        if not text:
            return _fallback_summary(context)
        parsed = json.loads(text)
        summary = OpenAISummary.model_validate(parsed)
        summary.used_openai = True
        return summary
    except (
        httpx.HTTPError,
        json.JSONDecodeError,
        ValidationError,
        KeyError,
        TypeError,
        ValueError,
    ):
        return _fallback_summary(context)
