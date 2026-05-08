# rampready MVP

rampready helps people new to boating answer one practical question before towing to the water:

**"Is this ramp a good place to launch from during this time window?"**

This MVP includes:
- Mobile app (`apps/mobile`) for users.
- Admin web app (`apps/admin`) for curation and operations.
- FastAPI backend (`services/api`) with auth, ramp search, source ingestion, and launch scoring.
- APScheduler worker for recurring refresh jobs.
- PostgreSQL/PostGIS + Redis via docker-compose.

## Product constraints
- Planning-only; not navigation or safety-critical guidance.
- No paid subscription implementation in MVP (entitlement-ready fields only).
- Florida/Tampa Bay demo-first.

## Architecture
See `docs/ARCHITECTURE.md`.

## Local setup

### 1) Prerequisites
- Docker + Docker Compose
- Python 3.12 (for local non-docker API dev)
- Node 20+

### 2) Environment
Copy `.env.example` to `.env` and adjust values.

### 3) Start infrastructure
```bash
make up
```
This starts Postgres, Redis, API, and worker.

### 4) Run migrations
```bash
make migrate
```

### 5) Seed demo data
```bash
make seed
```
Creates:
- admin user (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Tampa Bay region

### 6) Import FWC ramps
```bash
make import-fwc
```

### Local fallback without Docker
If Docker is not installed, you can run a lightweight local API against SQLite for development:

```bash
brew install python@3.12
cd services/api
/opt/homebrew/bin/python3.12 -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
DATABASE_URL="sqlite+pysqlite:///./rampready.local.db" python -c "from app.db import Base, engine, SessionLocal; from app.jobs.seed import run_seed; from app.services.importers import import_fwc_ramps; Base.metadata.create_all(bind=engine); run_seed(); db=SessionLocal(); print(import_fwc_ramps(db, use_fixture=True)); db.close()"
DATABASE_URL="sqlite+pysqlite:///./rampready.local.db" uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then run:

```bash
cd apps/admin && VITE_API_BASE_URL=http://localhost:8000 npm run dev -- --host 127.0.0.1 --port 5173
cd apps/mobile && EXPO_PUBLIC_API_BASE_URL=http://localhost:8000 npm run start -- --localhost
```

## Running services

### API
```bash
make api
```
OpenAPI docs: `http://localhost:8000/docs`

### Worker
```bash
make worker
```

### Admin app
```bash
make admin
```
Runs at `http://localhost:5173`.

### Mobile app
```bash
make mobile
```
Expo dev server starts for simulator/device.

## docker-compose services
- `postgres` (PostGIS)
- `redis`
- `api`
- `worker`
- `admin` (optional dev helper service)

## API highlights
- Health: `/health`, `/version`
- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- User/profile/saved ramps: `/me/profile`, `/me/saved-ramps`, `/me/dashboard`
- Ramps: `/ramps`, `/ramps/{id}`, `/ramps/{id}/conditions`, `/ramps/{id}/launch-windows`
- Reports: `/ramps/{id}/reports`
- Sources debug: `/sources/status`, `/sources/ramps/{id}/summary`
- Admin: `/admin/*` (requires `role=admin`)

## Data source notes
See `docs/DATA_SOURCES.md`.

## Scoring notes
See `docs/SCORING.md`.

## Disclaimer
See `docs/DISCLAIMER.md`.

Required text:

> rampready is a planning and awareness tool only. It is not a navigation tool, not an emergency service, and not a substitute for official marine forecasts, nautical charts, local knowledge, or safe boating judgment. Weather, tide, water-level, current, buoy, and ramp information may be delayed, incomplete, preliminary, or inaccurate. Always check official NOAA/NWS sources and local conditions before launching.

## Testing

Backend tests:
```bash
make test
```

Backend lint:
```bash
make lint
```

Admin typecheck/build:
```bash
cd apps/admin && npm install && npm run typecheck && npm run build
```

Mobile typecheck:
```bash
cd apps/mobile && npm install && npm run typecheck
```

## Known limitations
- PostGIS geography columns are modeled in schema design but simplified in ORM for rapid MVP slice portability.
- Station linking is currently a pragmatic placeholder and should be upgraded with full spatial nearest-neighbor logic.
- Open-Meteo integration is optional and disabled by default.
- Worker schedule includes placeholders for some deeper ingestion/linking behavior.
- Push notifications are not implemented; preference fields are modeled for future work.

## Roadmap (post-MVP)
- Expo push notifications.
- Subscription/paywall integration (Stripe/RevenueCat).
- Additional regions beyond Florida.
- Better marine-zone polygons and richer confidence calibration.
- Offline-first enhancements and caching UX in mobile.
- More complete OSM/manual curation workflows.
