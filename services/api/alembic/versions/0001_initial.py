"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-28 03:25:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def _uuid_pk():
  return sa.String(length=36)


def upgrade() -> None:
  op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
  op.create_table(
    "users",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("email", sa.String(320), nullable=False, unique=True),
    sa.Column("password_hash", sa.String(255), nullable=False),
    sa.Column("role", sa.String(20), nullable=False, server_default="user"),
    sa.Column("subscription_tier", sa.String(20), nullable=False, server_default="free"),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
  )
  op.create_table(
    "regions",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("name", sa.String(120), nullable=False),
    sa.Column("slug", sa.String(120), nullable=False, unique=True),
    sa.Column("bbox_geojson", sa.JSON(), nullable=True),
    sa.Column("default_timezone", sa.String(64), nullable=False),
    sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
  )
  op.create_table(
    "ramps",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("region_id", _uuid_pk(), sa.ForeignKey("regions.id"), nullable=True),
    sa.Column("name", sa.String(255), nullable=False),
    sa.Column("slug", sa.String(255), nullable=True),
    sa.Column("latitude", sa.Numeric(10, 6), nullable=False),
    sa.Column("longitude", sa.Numeric(10, 6), nullable=False),
    sa.Column("address", sa.Text(), nullable=True),
    sa.Column("city", sa.String(120), nullable=True),
    sa.Column("county", sa.String(120), nullable=True),
    sa.Column("state", sa.String(40), nullable=True),
    sa.Column("source", sa.String(40), nullable=False),
    sa.Column("source_id", sa.String(120), nullable=True),
    sa.Column("source_url", sa.Text(), nullable=True),
    sa.Column("source_updated_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("raw_source", sa.JSON(), nullable=True),
    sa.Column("status", sa.String(20), nullable=False, server_default="unknown"),
    sa.Column("trailer_friendly", sa.Boolean(), nullable=True),
    sa.Column("kayak_friendly", sa.Boolean(), nullable=True),
    sa.Column("jet_ski_friendly", sa.Boolean(), nullable=True),
    sa.Column("parking", sa.Text(), nullable=True),
    sa.Column("fee", sa.Text(), nullable=True),
    sa.Column("hours", sa.Text(), nullable=True),
    sa.Column("restrooms", sa.Boolean(), nullable=True),
    sa.Column("fuel_nearby", sa.Boolean(), nullable=True),
    sa.Column("bait_nearby", sa.Boolean(), nullable=True),
    sa.Column("lanes", sa.Integer(), nullable=True),
    sa.Column("managing_agency", sa.Text(), nullable=True),
    sa.Column("notes", sa.Text(), nullable=True),
    sa.Column("local_hazards", sa.Text(), nullable=True),
    sa.Column("min_recommended_tide_ft_mllw", sa.Numeric(6, 2), nullable=True),
    sa.Column("manually_verified_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("confidence_score", sa.Integer(), nullable=False, server_default="50"),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
  )
  op.create_table(
    "user_profiles",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("user_id", _uuid_pk(), sa.ForeignKey("users.id"), nullable=False, unique=True),
    sa.Column("display_name", sa.String(120), nullable=True),
    sa.Column("home_region", sa.String(120), nullable=True),
    sa.Column("boat_type", sa.String(40), nullable=True),
    sa.Column("boat_length_ft", sa.Numeric(6, 2), nullable=True),
    sa.Column("max_wind_kt", sa.Numeric(6, 2), nullable=False, server_default="15"),
    sa.Column("max_gust_kt", sa.Numeric(6, 2), nullable=False, server_default="22"),
    sa.Column("max_wave_height_ft", sa.Numeric(6, 2), nullable=False, server_default="2.0"),
    sa.Column("min_tide_height_ft_mllw", sa.Numeric(6, 2), nullable=True),
    sa.Column("daylight_only", sa.Boolean(), nullable=False, server_default=sa.true()),
    sa.Column("thunderstorm_policy", sa.String(20), nullable=False, server_default="red"),
    sa.Column("notify_good_windows", sa.Boolean(), nullable=False, server_default=sa.true()),
    sa.Column("notify_alerts", sa.Boolean(), nullable=False, server_default=sa.true()),
    sa.Column("notify_threshold_changes", sa.Boolean(), nullable=False, server_default=sa.true()),
    sa.Column("quiet_hours_start", sa.String(5), nullable=True),
    sa.Column("quiet_hours_end", sa.String(5), nullable=True),
    sa.Column("weekend_only", sa.Boolean(), nullable=False, server_default=sa.false()),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
  )
  op.create_table(
    "saved_ramps",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("user_id", _uuid_pk(), sa.ForeignKey("users.id"), nullable=False),
    sa.Column("ramp_id", _uuid_pk(), sa.ForeignKey("ramps.id"), nullable=False),
    sa.Column("nickname", sa.String(120), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("user_id", "ramp_id", name="uq_saved_user_ramp"),
  )
  op.create_table(
    "stations",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("provider", sa.String(40), nullable=False),
    sa.Column("provider_station_id", sa.String(120), nullable=False),
    sa.Column("name", sa.String(255), nullable=True),
    sa.Column("station_type", sa.String(40), nullable=False),
    sa.Column("latitude", sa.Numeric(10, 6), nullable=True),
    sa.Column("longitude", sa.Numeric(10, 6), nullable=True),
    sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    sa.Column("products", sa.JSON(), nullable=True),
    sa.Column("metadata", sa.JSON(), nullable=True),
    sa.Column("source_url", sa.Text(), nullable=True),
    sa.Column("last_metadata_sync_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("provider", "provider_station_id", "station_type", name="uq_station_provider_key"),
  )
  op.create_table(
    "ramp_station_links",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("ramp_id", _uuid_pk(), sa.ForeignKey("ramps.id"), nullable=False),
    sa.Column("station_id", _uuid_pk(), sa.ForeignKey("stations.id"), nullable=False),
    sa.Column("link_type", sa.String(40), nullable=False),
    sa.Column("distance_nm", sa.Numeric(8, 2), nullable=True),
    sa.Column("bearing_deg", sa.Numeric(6, 2), nullable=True),
    sa.Column("confidence_score", sa.Integer(), nullable=False, server_default="50"),
    sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false()),
    sa.Column("notes", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("ramp_id", "station_id", "link_type", name="uq_ramp_station_link"),
  )
  op.create_table(
    "weather_forecasts",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("ramp_id", _uuid_pk(), sa.ForeignKey("ramps.id"), nullable=True),
    sa.Column("station_id", _uuid_pk(), sa.ForeignKey("stations.id"), nullable=True),
    sa.Column("source", sa.String(40), nullable=False),
    sa.Column("forecast_generated_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("valid_time", sa.DateTime(timezone=True), nullable=False),
    sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
    sa.Column("wind_speed_kt", sa.Numeric(8, 2), nullable=True),
    sa.Column("wind_gust_kt", sa.Numeric(8, 2), nullable=True),
    sa.Column("wind_direction_deg", sa.Numeric(8, 2), nullable=True),
    sa.Column("wave_height_ft", sa.Numeric(8, 2), nullable=True),
    sa.Column("wave_period_sec", sa.Numeric(8, 2), nullable=True),
    sa.Column("wave_direction_deg", sa.Numeric(8, 2), nullable=True),
    sa.Column("precipitation_probability_pct", sa.Numeric(8, 2), nullable=True),
    sa.Column("thunderstorm_probability_pct", sa.Numeric(8, 2), nullable=True),
    sa.Column("weather_summary", sa.Text(), nullable=True),
    sa.Column("raw_payload", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
  )
  op.create_table(
    "observations",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("station_id", _uuid_pk(), sa.ForeignKey("stations.id"), nullable=False),
    sa.Column("source", sa.String(40), nullable=False),
    sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("wind_speed_kt", sa.Numeric(8, 2), nullable=True),
    sa.Column("wind_gust_kt", sa.Numeric(8, 2), nullable=True),
    sa.Column("wind_direction_deg", sa.Numeric(8, 2), nullable=True),
    sa.Column("wave_height_ft", sa.Numeric(8, 2), nullable=True),
    sa.Column("dominant_period_sec", sa.Numeric(8, 2), nullable=True),
    sa.Column("average_period_sec", sa.Numeric(8, 2), nullable=True),
    sa.Column("mean_wave_direction_deg", sa.Numeric(8, 2), nullable=True),
    sa.Column("water_level_ft_mllw", sa.Numeric(8, 2), nullable=True),
    sa.Column("tide_height_ft_mllw", sa.Numeric(8, 2), nullable=True),
    sa.Column("current_speed_kt", sa.Numeric(8, 2), nullable=True),
    sa.Column("current_direction_deg", sa.Numeric(8, 2), nullable=True),
    sa.Column("air_temperature_f", sa.Numeric(8, 2), nullable=True),
    sa.Column("water_temperature_f", sa.Numeric(8, 2), nullable=True),
    sa.Column("pressure_mb", sa.Numeric(8, 2), nullable=True),
    sa.Column("visibility_nm", sa.Numeric(8, 2), nullable=True),
    sa.Column("raw_payload", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("station_id", "observed_at", "source", name="uq_observation_station_time_source"),
  )
  op.create_table(
    "tide_predictions",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("station_id", _uuid_pk(), sa.ForeignKey("stations.id"), nullable=False),
    sa.Column("predicted_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("tide_height_ft_mllw", sa.Numeric(8, 2), nullable=True),
    sa.Column("type", sa.String(20), nullable=True),
    sa.Column("raw_payload", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("station_id", "predicted_at", name="uq_tide_station_time"),
  )
  op.create_table(
    "current_predictions",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("station_id", _uuid_pk(), sa.ForeignKey("stations.id"), nullable=False),
    sa.Column("predicted_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("current_speed_kt", sa.Numeric(8, 2), nullable=True),
    sa.Column("current_direction_deg", sa.Numeric(8, 2), nullable=True),
    sa.Column("type", sa.String(20), nullable=True),
    sa.Column("raw_payload", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("station_id", "predicted_at", name="uq_current_station_time"),
  )
  op.create_table(
    "alerts",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("source", sa.String(20), nullable=False),
    sa.Column("source_alert_id", sa.String(255), nullable=False, unique=True),
    sa.Column("ramp_id", _uuid_pk(), sa.ForeignKey("ramps.id"), nullable=True),
    sa.Column("event", sa.String(255), nullable=False),
    sa.Column("headline", sa.Text(), nullable=True),
    sa.Column("description", sa.Text(), nullable=True),
    sa.Column("instruction", sa.Text(), nullable=True),
    sa.Column("severity", sa.String(30), nullable=True),
    sa.Column("certainty", sa.String(30), nullable=True),
    sa.Column("urgency", sa.String(30), nullable=True),
    sa.Column("area_desc", sa.Text(), nullable=True),
    sa.Column("effective_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("raw_payload", sa.JSON(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
  )
  op.create_table(
    "launch_scores",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("ramp_id", _uuid_pk(), sa.ForeignKey("ramps.id"), nullable=False),
    sa.Column("user_profile_id", _uuid_pk(), sa.ForeignKey("user_profiles.id"), nullable=True),
    sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("color", sa.String(20), nullable=False),
    sa.Column("score", sa.Numeric(8, 2), nullable=False),
    sa.Column("confidence_score", sa.Integer(), nullable=False, server_default="50"),
    sa.Column("reasons", sa.JSON(), nullable=False),
    sa.Column("source_summary", sa.JSON(), nullable=False),
    sa.Column("thresholds", sa.JSON(), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.UniqueConstraint("ramp_id", "user_profile_id", "starts_at", "ends_at", name="uq_launch_window"),
  )
  op.create_table(
    "ramp_reports",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("user_id", _uuid_pk(), sa.ForeignKey("users.id"), nullable=True),
    sa.Column("ramp_id", _uuid_pk(), sa.ForeignKey("ramps.id"), nullable=False),
    sa.Column("report_type", sa.String(40), nullable=False),
    sa.Column("message", sa.Text(), nullable=True),
    sa.Column("photo_url", sa.Text(), nullable=True),
    sa.Column("status", sa.String(20), nullable=False, server_default="new"),
    sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
  )
  op.create_table(
    "job_runs",
    sa.Column("id", _uuid_pk(), primary_key=True),
    sa.Column("job_name", sa.String(100), nullable=False),
    sa.Column("status", sa.String(20), nullable=False),
    sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("details", sa.JSON(), nullable=True),
    sa.Column("error", sa.Text(), nullable=True),
  )


def downgrade() -> None:
  for table in [
    "job_runs",
    "ramp_reports",
    "launch_scores",
    "alerts",
    "current_predictions",
    "tide_predictions",
    "observations",
    "weather_forecasts",
    "ramp_station_links",
    "stations",
    "saved_ramps",
    "user_profiles",
    "ramps",
    "regions",
    "users",
  ]:
    op.drop_table(table)
