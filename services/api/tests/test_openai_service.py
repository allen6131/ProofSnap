import json

import pytest

from app.services import openai_service


class _FakeResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "output_text": json.dumps(
                {
                    "assistant_message": "Use the first ramp, but verify official sources.",
                    "spot_notes": [
                        {
                            "ramp_id": "ramp-1",
                            "boating_notes": ["Light wind in the supplied context."],
                            "fishing_notes": ["Good access context only; verify FWC rules."],
                        }
                    ],
                    "warnings": ["No catch guarantee."],
                    "suggested_followups": ["What data is missing?"],
                }
            )
        }


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, *args, **kwargs):
        return _FakeResponse()


@pytest.mark.asyncio
async def test_openai_summary_uses_structured_response(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    openai_service.get_settings.cache_clear()
    monkeypatch.setattr(openai_service.httpx, "AsyncClient", _FakeAsyncClient)

    summary = await openai_service.generate_chat_recommendation_text(
        {
            "intent": "both",
            "warnings": [],
            "recommendations": [{"ramp_id": "ramp-1", "name": "Demo Ramp"}],
            "sources": [],
        }
    )

    assert summary.used_openai is True
    assert summary.assistant_message.startswith("Use the first ramp")
    assert summary.spot_notes[0].ramp_id == "ramp-1"

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    openai_service.get_settings.cache_clear()
