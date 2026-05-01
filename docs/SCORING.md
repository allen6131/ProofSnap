# Launch Scoring

RampReady computes 3-hour launch windows for 7 days.

## Window blocks
- 00:00-03:00
- 03:00-06:00
- 06:00-09:00
- 09:00-12:00
- 12:00-15:00
- 15:00-18:00
- 18:00-21:00
- 21:00-24:00

## Thresholds
Per-profile thresholds come from `user_profiles` and default by boat type:
- `max_wind_kt`
- `max_gust_kt`
- `max_wave_height_ft`
- `min_tide_height_ft_mllw`
- `daylight_only`

## Color rules
### RED
- Severe/extreme alerts (including Small Craft Advisory and severe warning classes)
- Wind/gust/wave exceed user limits
- Tide below user/ramp minimum
- High thunderstorm risk
- Observation indicates unsafe conditions above limits

### YELLOW
- Near-threshold wind/gust/wave (80-100%)
- Moderate advisory conditions
- Forecast/observation mismatch
- Medium confidence

### GREEN
- No severe alerts
- Wind/gust/wave comfortably below limits
- Data fresh with confidence >= 70

### GRAY
- Missing critical data or very low confidence

## Confidence score
Starts at 100 and subtracts penalties:
- stale forecast / observations / tide
- missing wave forecast
- unverified ramp
- forecast-vs-observation mismatch
- critical source failure

## Forecast-vs-observation downgrade
- If observed gust > forecast gust by 25%: downgrade green to yellow.
- If observed gust exceeds user limit: red.
- If observed wave > forecast wave by 30%: downgrade green to yellow.
- If observed wave exceeds user limit: red.

## Missing data behavior
- Missing critical weather+observation data returns gray.
- Missing non-critical signals can return yellow with reasons.

## Example reason object
```json
{
  "severity": "caution",
  "code": "wind_near_limit",
  "message": "Wind is near your limit (14.0 kt).",
  "source": "NWS",
  "value": 14,
  "threshold": 15
}
```
