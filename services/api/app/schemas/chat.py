from __future__ import annotations

from datetime import date as dt_date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

ChatIntent = Literal["boating", "fishing", "both"]


class ChatRecommendationRequest(BaseModel):
    message: str = Field(min_length=3, max_length=1000)
    intent: ChatIntent | None = None
    region: str | None = Field(default=None, max_length=120)
    near_lat: float | None = Field(default=None, ge=-90, le=90)
    near_lon: float | None = Field(default=None, ge=-180, le=180)
    date: dt_date | None = None
    candidate_limit: int | None = Field(default=None, ge=1, le=10)

    @model_validator(mode="after")
    def validate_coordinates(self) -> "ChatRecommendationRequest":
        if (self.near_lat is None) != (self.near_lon is None):
            raise ValueError("near_lat and near_lon must be provided together")
        return self


class ChatSourceCard(BaseModel):
    name: str
    provider: str
    url: str | None = None
    observed_at: datetime | None = None
    updated_at: datetime | None = None
    freshness_minutes: int | None = None
    status: Literal["ok", "stale", "missing", "error", "supplemental"] = "ok"
    notes: list[str] = Field(default_factory=list)


class ChatBestWindow(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    color: str
    score: float
    confidence_score: int


class ChatSpotRecommendation(BaseModel):
    ramp_id: str
    name: str
    city: str | None = None
    state: str | None = None
    latitude: float
    longitude: float
    rank: int
    fit_score: float
    launch_color: Literal["green", "yellow", "red", "gray"]
    confidence_score: int
    best_window: ChatBestWindow | None = None
    top_reasons: list[dict[str, Any]] = Field(default_factory=list)
    boating_notes: list[str] = Field(default_factory=list)
    fishing_notes: list[str] = Field(default_factory=list)
    source_cards: list[ChatSourceCard] = Field(default_factory=list)
    missing_data: list[str] = Field(default_factory=list)


class ChatRecommendationResponse(BaseModel):
    assistant_message: str
    intent: ChatIntent
    recommendations: list[ChatSpotRecommendation] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    disclaimer: str
    sources: list[ChatSourceCard] = Field(default_factory=list)
    suggested_followups: list[str] = Field(default_factory=list)
    used_openai: bool = False
