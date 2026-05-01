from pydantic import BaseModel


class RampUpdateRequest(BaseModel):
    name: str | None = None
    status: str | None = None
    notes: str | None = None
    local_hazards: str | None = None
    min_recommended_tide_ft_mllw: float | None = None
    confidence_score: int | None = None
    trailer_friendly: bool | None = None
    kayak_friendly: bool | None = None
    jet_ski_friendly: bool | None = None


class StationLinkCreateRequest(BaseModel):
    station_id: str
    link_type: str
    distance_nm: float | None = None
    bearing_deg: float | None = None
    confidence_score: int = 50
    is_primary: bool = False
    notes: str | None = None


class StationLinkUpdateRequest(BaseModel):
    distance_nm: float | None = None
    bearing_deg: float | None = None
    confidence_score: int | None = None
    is_primary: bool | None = None
    notes: str | None = None
