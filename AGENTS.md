# AGENTS.md - rampready

## Project mission
Build **rampready**, a beginner-friendly planning app for people new to boating who need help deciding whether a ramp and launch window look approachable before towing to the water.

The MVP promise is: **search ramps, save favorites, understand weather/tide/alert-driven launch windows, and tune guidance to a beginner's boat and comfort level.**

## Current stack
- React Native + Expo mobile app in `apps/mobile`.
- TypeScript everywhere in frontend packages.
- Vite + React admin app in `apps/admin`.
- FastAPI backend in `services/api`.
- SQLAlchemy 2.x, Alembic, PostgreSQL/PostGIS for local/prod-like data.
- SQLite for backend tests.
- APScheduler worker for recurring source refresh jobs.
- Docker Compose for Postgres, Redis, API, worker, and optional admin dev service.

## Product constraints
- rampready is planning-only.
- It is not a navigation tool, emergency tool, safety-critical system, or substitute for official marine forecasts, nautical charts, local knowledge, or safe boating judgment.
- Target Florida/Tampa Bay first.
- Bias defaults toward people new to boating.
- Prefer plain-language explanations over raw data dumps.
- Keep source attribution visible for NWS, NOAA CO-OPS, NOAA NDBC, FWC, and other official sources.
- Mark missing, stale, or low-confidence data clearly.
- Do not imply launch scores are official government recommendations.
- No AI features in the MVP.
- No paid subscription implementation until the core planning flow works.

## Core MVP user flow
1. User opens the app and registers or logs in.
2. User searches launch ramps in the target region.
3. User opens a ramp detail page.
4. User reviews beginner-friendly launch windows, reasons, confidence, source notes, and disclaimer.
5. User saves favorite ramps.
6. User adjusts boat type and comfort thresholds in Settings.
7. Dashboard shows saved ramps with upcoming launch guidance.
8. User can report a ramp issue for admin review.

## Admin MVP flow
1. Admin logs into the web dashboard.
2. Admin reviews overview metrics and source health.
3. Admin imports or refreshes source data.
4. Admin reviews, edits, and verifies ramps.
5. Admin reviews submitted ramp reports and station/source status.

## Data model themes
Use IDs as strings. Prefer UUIDs if available.

Core entities include:
- `User`
- `UserProfile`
- `Region`
- `Ramp`
- `SavedRamp`
- `WeatherForecast`
- `Observation`
- `TidePrediction`
- `Alert`
- `LaunchScore`
- `RampReport`
- `DataSourceStatus`
- `JobRun`

## Scoring requirements
- Generate launch windows from source data and user thresholds.
- Return a simple color: green, yellow, red, or gray.
- Include reasons in plain language.
- Include confidence.
- Downgrade confidence for missing, stale, or conflicting data.
- Keep scoring deterministic and unit tested.
- Keep official source data separate from rampready interpretations.

## Code organization
Respect the existing monorepo structure:

```text
apps/
  mobile/
  admin/
services/
  api/
docs/
```

Keep platform/library calls out of UI components when practical. Use feature-level services, API clients, and backend service modules.

## Coding standards
- TypeScript in frontend packages.
- Python 3.12 in backend.
- Prefer small typed functions over large components.
- Avoid `any` unless there is a clear reason.
- Keep UI state simple.
- Use explicit loading, error, and empty states.
- Validate user input before saving.
- Show friendly error messages for auth, API, source, and scoring failures.
- Do not leave dead code or unused dependencies.
- Keep comments rare and useful.

## Testing expectations
Add or maintain tests where they give high value without slowing the project down:
- Launch scoring tests.
- Unit conversion tests.
- Importer/parser tests.
- Auth, saved-ramp limit, and admin route smoke tests.
- Frontend typechecks.

Also keep `docs/QA_CHECKLIST.md` aligned with the actual product.

## Privacy and permissions
- Do not request device location automatically on launch.
- Do not record tracks or collect navigation history in the MVP.
- If location-based search is added later, make it opt-in and explain why it is needed.
- Do not upload personal boating activity beyond user-created account, profile, saved-ramp, and report data required by the API.

## Out of scope until MVP is complete
- Navigation or routing.
- Emergency/SOS features.
- Charts or mapplotter replacement.
- Social/community features.
- AI recommendations.
- Complex offline packs.
- Real-money subscriptions.
- Multi-region expansion beyond the first launch area.

## Definition of done for the MVP
The MVP is done when a user can:
- Register and log in.
- Search ramps.
- Open ramp details.
- Understand next launch windows and top reasons.
- Save ramps.
- Adjust beginner comfort thresholds.
- Restart the app and still see saved ramps.
- See clear planning-only disclaimers.
- Admin can import/curate ramps and review source status.
