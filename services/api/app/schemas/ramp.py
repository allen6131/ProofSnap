from datetime import datetime
from typing import Any

from pydantic import BaseModel


class RampIssueRequest(BaseModel):
    report_type: str
    message: str | None = None
    photo_url: str | None = None


class LaunchReason(BaseModel):
    severity: str
    code: str
    message: str
    source: str
    value: float | str | None = None
    threshold: float | str | None = None


class LaunchWindowResponse(BaseModel):
    starts_at: datetime
    ends_at: datetime
    color: str
    score: float
    confidence_score: int
    reasons: list[LaunchReason]
    source_summary: dict[str, Any]
    thresholds: dict[str, Any]
