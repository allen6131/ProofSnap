# rampready data and caching design

rampready is API-backed in the MVP. User profiles, saved ramps, source data, launch scores, and
admin curation live in the backend database.

## MVP status

- No photo, location-track, or navigation recording feature is implemented.
- Mobile users sign in so saved ramps and launch preferences can sync through the API.
- Source data is fetched from official providers or local fixtures and stored for scoring.
- Offline mobile caching is not yet implemented.

## Future offline requirements

1. Cache saved ramps and recent launch windows on device.
2. Clearly mark cached data with last-updated timestamps.
3. Never imply cached data is safe for current launch decisions.
4. Revalidate source data before presenting fresh scores.
5. Keep cache logic separate from launch scoring and source ingestion.

Offline support should improve planning convenience without weakening the planning-only disclaimer.
