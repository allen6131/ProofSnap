# rampready MVP Specification

## Non-negotiable MVP scope
The first version should be intentionally small:

1. Ramp search
2. Ramp detail pages
3. Auth and saved ramps
4. User launch preferences
5. Weather/tide/alert source ingestion
6. Beginner-friendly launch-window scoring
7. Ramp issue reporting
8. Admin curation tools

## Ramp search
### Requirements
- Show ramps for the target launch region.
- Allow search by ramp, city, or area.
- Show ramp name, location, and confidence score.
- Empty state should explain how to search or import demo data.

### Actions
- Search ramps.
- Open ramp detail.
- Save ramp when signed in.

## Ramp detail
### Requirements
- Show ramp name, city/state, verification status, local hazards, notes, and disclaimer.
- Show launch windows for the next 48 hours.
- Include plain-language reasons for each score.
- Show official data source names.
- Allow issue reporting.

## Dashboard and saved ramps
### Requirements
- Show saved ramps with the next best launch window.
- Highlight active alerts.
- Explain what to do when no ramps are saved.
- Enforce free-tier saved-ramp limits through backend logic.

## Launch preferences
### Fields
- Boat type
- Max wind in knots
- Max gust in knots
- Max wave height in feet
- Optional minimum tide/water level
- Daylight-only preference

### Requirements
- Store preferences on the user profile.
- Use preferences in launch-window scoring.
- Keep defaults conservative for new boaters.

## Source ingestion
### Requirements
- Import FWC ramps for the launch region.
- Pull or fixture official forecast, tide, buoy, and alert data.
- Mark stale or missing data clearly.
- Keep source-specific code isolated behind clients/importers.

## Admin dashboard
### Requirements
- Admin login.
- Overview metrics.
- Ramp list and ramp edit/verify flow.
- Source refresh and import jobs.
- Reports and stations review.

## Disclaimers
### Requirements
- State that rampready is planning-only.
- Do not present scores as official NOAA/NWS recommendations.
- Encourage users to check official sources and local conditions before launching.

## Entitlement placeholder
Build the app so real purchases can be added later.

For MVP development:
- Use backend subscription-tier fields.
- Keep limits small and transparent.
- Keep purchase-provider-specific code out of the core ramp/scoring flow.

