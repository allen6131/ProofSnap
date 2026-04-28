from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base



def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = 'users'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default='user')
    subscription_tier: Mapped[str] = mapped_column(String(20), default='free')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    profile: Mapped['UserProfile'] = relationship(back_populates='user', uselist=False)


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    home_region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    boat_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    boat_length_ft: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    max_wind_kt: Mapped[float] = mapped_column(Numeric(6, 2), default=15)
    max_gust_kt: Mapped[float] = mapped_column(Numeric(6, 2), default=22)
    max_wave_height_ft: Mapped[float] = mapped_column(Numeric(6, 2), default=2)
    min_tide_height_ft_mllw: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    daylight_only: Mapped[bool] = mapped_column(Boolean, default=True)
    thunderstorm_policy: Mapped[str] = mapped_column(String(20), default='red')
    notify_good_windows: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_threshold_changes: Mapped[bool] = mapped_column(Boolean, default=True)
    quiet_hours_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    quiet_hours_end: Mapped[str | None] = mapped_column(String(5), nullable=True)
    weekend_only: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped[User] = relationship(back_populates='profile')


class Region(Base):
    __tablename__ = 'regions'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    bbox_geojson: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    default_timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Ramp(Base):
    __tablename__ = 'ramps'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    region_id: Mapped[str | None] = mapped_column(ForeignKey('regions.id'), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    county: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(40), nullable=True)
    source: Mapped[str] = mapped_column(String(40), nullable=False)
    source_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_source: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='unknown')
    trailer_friendly: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    kayak_friendly: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    jet_ski_friendly: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    parking: Mapped[str | None] = mapped_column(Text, nullable=True)
    fee: Mapped[str | None] = mapped_column(Text, nullable=True)
    hours: Mapped[str | None] = mapped_column(Text, nullable=True)
    restrooms: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    fuel_nearby: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    bait_nearby: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    lanes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    managing_agency: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_hazards: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_recommended_tide_ft_mllw: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    manually_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class SavedRamp(Base):
    __tablename__ = 'saved_ramps'
    __table_args__ = (UniqueConstraint('user_id', 'ramp_id', name='uq_saved_user_ramp'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), nullable=False)
    ramp_id: Mapped[str] = mapped_column(ForeignKey('ramps.id'), nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Station(Base):
    __tablename__ = 'stations'
    __table_args__ = (UniqueConstraint('provider', 'provider_station_id', 'station_type', name='uq_station_provider_key'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    provider_station_id: Mapped[str] = mapped_column(String(120), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    station_type: Mapped[str] = mapped_column(String(40), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    products: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_metadata_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class RampStationLink(Base):
    __tablename__ = 'ramp_station_links'
    __table_args__ = (UniqueConstraint('ramp_id', 'station_id', 'link_type', name='uq_ramp_station_link'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ramp_id: Mapped[str] = mapped_column(ForeignKey('ramps.id'), nullable=False)
    station_id: Mapped[str] = mapped_column(ForeignKey('stations.id'), nullable=False)
    link_type: Mapped[str] = mapped_column(String(40), nullable=False)
    distance_nm: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    bearing_deg: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class WeatherForecast(Base):
    __tablename__ = 'weather_forecasts'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ramp_id: Mapped[str | None] = mapped_column(ForeignKey('ramps.id'), nullable=True)
    station_id: Mapped[str | None] = mapped_column(ForeignKey('stations.id'), nullable=True)
    source: Mapped[str] = mapped_column(String(40), nullable=False)
    forecast_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    wind_speed_kt: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wind_gust_kt: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wind_direction_deg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wave_height_ft: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wave_period_sec: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wave_direction_deg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    precipitation_probability_pct: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    thunderstorm_probability_pct: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    weather_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Observation(Base):
    __tablename__ = 'observations'
    __table_args__ = (UniqueConstraint('station_id', 'observed_at', 'source', name='uq_observation_station_time_source'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id: Mapped[str] = mapped_column(ForeignKey('stations.id'), nullable=False)
    source: Mapped[str] = mapped_column(String(40), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    wind_speed_kt: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wind_gust_kt: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wind_direction_deg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    wave_height_ft: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    dominant_period_sec: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    average_period_sec: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    mean_wave_direction_deg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    water_level_ft_mllw: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    tide_height_ft_mllw: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    current_speed_kt: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    current_direction_deg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    air_temperature_f: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    water_temperature_f: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    pressure_mb: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    visibility_nm: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TidePrediction(Base):
    __tablename__ = 'tide_predictions'
    __table_args__ = (UniqueConstraint('station_id', 'predicted_at', name='uq_tide_station_time'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id: Mapped[str] = mapped_column(ForeignKey('stations.id'), nullable=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    tide_height_ft_mllw: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class CurrentPrediction(Base):
    __tablename__ = 'current_predictions'
    __table_args__ = (UniqueConstraint('station_id', 'predicted_at', name='uq_current_station_time'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id: Mapped[str] = mapped_column(ForeignKey('stations.id'), nullable=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_speed_kt: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    current_direction_deg: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Alert(Base):
    __tablename__ = 'alerts'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    source_alert_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    ramp_id: Mapped[str | None] = mapped_column(ForeignKey('ramps.id'), nullable=True)
    event: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instruction: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str | None] = mapped_column(String(30), nullable=True)
    certainty: Mapped[str | None] = mapped_column(String(30), nullable=True)
    urgency: Mapped[str | None] = mapped_column(String(30), nullable=True)
    area_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    effective_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class LaunchScore(Base):
    __tablename__ = 'launch_scores'
    __table_args__ = (UniqueConstraint('ramp_id', 'user_profile_id', 'starts_at', 'ends_at', name='uq_launch_window'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ramp_id: Mapped[str] = mapped_column(ForeignKey('ramps.id'), nullable=False)
    user_profile_id: Mapped[str | None] = mapped_column(ForeignKey('user_profiles.id'), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False)
    source_summary: Mapped[dict] = mapped_column(JSON, nullable=False)
    thresholds: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class RampReport(Base):
    __tablename__ = 'ramp_reports'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    ramp_id: Mapped[str] = mapped_column(ForeignKey('ramps.id'), nullable=False)
    report_type: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default='new')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class JobRun(Base):
    __tablename__ = 'job_runs'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
