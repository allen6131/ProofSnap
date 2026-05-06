# Data Sources

## National Weather Service (NWS)
- Base: `https://api.weather.gov`
- Required headers:
  - `User-Agent: (rampready.local, contact@example.com)`
  - `Accept: application/geo+json`
- Endpoints:
  - `/points/{lat},{lon}` for grid mapping
  - `/gridpoints/{office}/{gridX},{gridY}` for numeric forecast grid
  - `/gridpoints/{office}/{gridX},{gridY}/forecast/hourly` fallback
  - `/alerts/active?point={lat},{lon}` for alerts
- Parsing normalizes wind strings like `10 mph`, `10 to 15 mph`, `15 kt`.

## NOAA CO-OPS Tides & Currents
- Data endpoint: `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
- Metadata endpoint: `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json`
- Products supported in MVP: `predictions`, with client helpers for `water_level`,
  `water_temperature`, `air_temperature`, `wind`, and current-style payloads when stations support
  those products.
- Recommended params:
  - `units=english`
  - `format=json`
  - `application=rampready`
  - `time_zone=lst_ldt` for user-facing tide output
  - `datum=MLLW`

## NOAA NDBC
- Base: `https://www.ndbc.noaa.gov/data/realtime2/`
- Files:
  - `{station}.txt` (standard met)
  - `{station}.spec` (wave summaries)
- Poll schedule for MVP worker: hourly near minute 30.
- Parser handles `MM` as missing.
- Runtime refresh attempts live station `.txt` and `.spec` reads and falls back to fixtures only for
  tests/development failures.

## Open-Meteo Marine (optional)
- Endpoint: `https://marine-api.open-meteo.com/v1/marine`
- Controlled by `ENABLE_OPEN_METEO`; disabled by default.
- Supplemental only; never used as sole critical source.

## Florida FWC Boat Ramp Inventory
- ArcGIS source:
  - `https://www.arcgis.com/home/item.html?id=1f95492ed263499f8faff1874f3de4ca`
  - `https://gis.myfwc.com/mapping/rest/services/Open_Data/FWC_Florida_Boat_Ramp_Inventory/MapServer/4/query`
- Imported as GeoJSON and filtered to Tampa Bay demo bbox.

## Florida FWC fishing regulations
- Source: `https://myfwc.com/fishing/saltwater/recreational/`
- Used by chat recommendations as an official attribution/reminder source for fishing questions.
- rampready does not provide legal advice; users must verify current seasons, closures, licenses,
  size limits, and bag limits with FWC.

## Florida Department of Health beach water quality
- Program info: `https://www.floridahealth.gov/environmental-health/beach-water-quality/`
- Supplemental ArcGIS source used by chat recommendations for nearby sampling/advisory context when
  available.
- Missing or unavailable water-quality data is shown as supplemental missing data and does not block
  core launch scoring.

## OpenStreetMap (dev-only)
- OSM slipway/access tags supported in architecture.
- Overpass is only for manual/dev import, never production runtime dependency.

## Caching and Polling
- Forecast refresh target: every 30-60 minutes.
- CO-OPS tide predictions: every 6-24 hours.
- Observations: every 6-15 minutes (CO-OPS), hourly (NDBC).
- Scores are recomputed on demand and in periodic worker jobs.

## Attribution and confidence
- Launch score responses include source names, timestamps, freshness, and confidence labels.
- Computed launch colors are rampready outputs, not official NOAA/NWS recommendations.
