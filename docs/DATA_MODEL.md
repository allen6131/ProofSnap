# rampready Data Model

The source of truth is the SQLAlchemy model layer in `services/api/app/models/entities.py`
and the Alembic migration in `services/api/alembic/versions/0001_initial.py`.

## Core entities
- `User`: authentication, role, and subscription tier.
- `UserProfile`: boat type, weather/tide comfort thresholds, daylight-only preference, and display name.
- `Region`: launch regions such as Tampa Bay.
- `Ramp`: boat ramp location, metadata, hazards, confidence, source, and manual verification status.
- `SavedRamp`: user favorites that power Dashboard and Saved tabs.
- `WeatherForecast`, `Observation`, `TidePrediction`, `Alert`: source data used by launch scoring.
- `LaunchScore`: stored launch-window score, color, confidence, reasons, and source summary.
- `RampReport`: user-submitted ramp issue reports.
- `DataSourceStatus` and `JobRun`: admin/source health and worker job tracking.

## Mobile TypeScript types
Keep API-facing TypeScript types in `apps/mobile/src/types` aligned with backend response shapes:

- `Ramp`
- `LaunchWindow`
- `Reason`
- Dashboard and saved-ramp response types as the UI grows.

## Storage policy
- Backend state lives in PostgreSQL/PostGIS for local and production-like development.
- Tests use SQLite for fast local backend runs.
- Mobile currently talks to the API; do not add a separate local database unless the product intentionally adds offline caching.
- Source data should remain attributable to official providers and should carry enough timestamp/confidence metadata for safe beginner-facing explanations.
