from datetime import datetime

from pydantic import BaseModel


class UserProfileRequest(BaseModel):
    display_name: str | None = None
    home_region: str | None = None
    boat_type: str | None = None
    boat_length_ft: float | None = None
    max_wind_kt: float = 15
    max_gust_kt: float = 22
    max_wave_height_ft: float = 2.0
    min_tide_height_ft_mllw: float | None = None
    daylight_only: bool = True
    thunderstorm_policy: str = "red"
    notify_good_windows: bool = True
    notify_alerts: bool = True
    notify_threshold_changes: bool = True
    quiet_hours_start: str | None = None
    quiet_hours_end: str | None = None
    weekend_only: bool = False


class UserProfileResponse(UserProfileRequest):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
