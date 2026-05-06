# rampready Manual QA Checklist

## App launch
- [ ] Mobile app launches and shows the `rampready` sign-in screen.
- [ ] Admin app launches and shows the `rampready Admin` login screen.
- [ ] Settings screen explains beginner-friendly launch preferences.

## Backend setup
- [ ] API health endpoint returns 200.
- [ ] Version endpoint returns `rampready-api`.
- [ ] Migrations run successfully.
- [ ] Seed job creates the admin user and Tampa Bay region.
- [ ] FWC import creates ramp records.

## Auth
- [ ] User can register from mobile.
- [ ] User can log in from mobile.
- [ ] Admin can log in with seeded credentials.
- [ ] Invalid credentials show a friendly error.

## Ramp discovery
- [ ] Ramp search returns ramps for the target region.
- [ ] Search by ramp or city narrows results.
- [ ] Ramp detail opens from search results.
- [ ] Ramp detail includes the planning disclaimer.

## Beginner launch guidance
- [ ] Launch windows show green/yellow/red/gray states.
- [ ] Each window explains top reasons in plain language.
- [ ] Missing or stale source data lowers confidence.
- [ ] Weather alerts affect launch guidance.
- [ ] Scores are not described as official agency recommendations.

## Saved ramps and preferences
- [ ] Signed-in user can save a ramp.
- [ ] Saved ramp appears in Dashboard and Saved tabs.
- [ ] Free-tier saved-ramp limit is enforced.
- [ ] User can update boat type and weather/tide thresholds.
- [ ] Updated preferences affect launch-window scoring.

## Admin
- [ ] Overview metrics load.
- [ ] Ramps page lists imported ramps.
- [ ] Admin can update and verify a ramp.
- [ ] Jobs page can trigger supported import/recompute jobs.
- [ ] Reports and stations pages load.

## Safety copy
- [ ] App states it is planning-only.
- [ ] App does not claim to replace nautical charts, forecasts, or local judgment.
- [ ] Official source names are visible where relevant.

## Regression
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] No unused dependencies.
- [ ] App works on iOS simulator/device.
- [ ] App works on Android emulator/device.

