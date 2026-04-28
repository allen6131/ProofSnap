# Architecture

## Monorepo layout
- `services/api`: FastAPI backend, SQLAlchemy models, Alembic migrations, worker jobs, tests.
- `apps/mobile`: Expo React Native app for boater-facing workflows.
- `apps/admin`: Vite React admin dashboard for curation and job controls.
- `docs`: product and technical documentation.

## Backend services
- FastAPI API with JWT auth and role-based admin routes.
- SQLAlchemy 2.x ORM models mapping ramps, users, stations, forecasts, observations, alerts, scores, reports, jobs.
- Source clients:
  - NWS
  - NOAA CO-OPS
  - NOAA NDBC
  - FWC importer
- Scoring engine in `app/scoring/launch_score.py`.

## Database
- PostgreSQL + PostGIS in docker compose.
- Initial Alembic migration creates MVP tables.
- SQLite in test runs for local fast backend tests.

## Worker jobs
- APScheduler-based worker process (`app/jobs/worker.py`) schedules data sync and maintenance tasks.
- Tracks runs in `job_runs`.

## Mobile flow
- Auth: login/register.
- Main tabs: Dashboard, Ramps, Saved, Settings.
- Ramp detail includes launch windows, source notes, save action, issue report, and disclaimer.

## Admin flow
- Login with admin credentials.
- Overview metrics and source health.
- Ramps table + verify/edit/refresh actions.
- Jobs page to trigger FWC import and recompute.
- Reports and stations pages.

## Future production deployment
- Keep API and worker as separately scalable services.
- Replace dev fixture fallbacks with robust cache layers and richer station-linking logic.
- Add proper PostGIS geography columns and spatial indexes for nearest-station matching at scale.
