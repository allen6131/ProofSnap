from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import (
    Alert,
    LaunchScore,
    Observation,
    Ramp,
    TidePrediction,
    UserProfile,
    WeatherForecast,
)


@dataclass
class Thresholds:
    max_wind_kt: float
    max_gust_kt: float
    max_wave_height_ft: float
    min_tide_height_ft_mllw: float | None
    daylight_only: bool


DEFAULT_THRESHOLDS = {
    "kayak": Thresholds(10, 15, 1.0, None, True),
    "jet_ski": Thresholds(15, 22, 2.0, None, True),
    "skiff": Thresholds(13, 20, 1.5, None, True),
    "center_console": Thresholds(16, 24, 2.5, None, True),
    "pontoon": Thresholds(12, 18, 1.5, None, True),
    "other": Thresholds(15, 22, 2.0, None, True),
}

SEVERE_ALERT_TERMS = {
    "small craft advisory",
    "gale warning",
    "storm warning",
    "hurricane warning",
    "hurricane watch",
    "tropical storm warning",
    "tropical storm watch",
    "special marine warning",
    "severe thunderstorm warning",
    "tornado warning",
}


def _window_start_floor(now: datetime) -> datetime:
    hour_bucket = (now.hour // 3) * 3
    return now.replace(hour=hour_bucket, minute=0, second=0, microsecond=0)


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _thresholds_for_profile(profile: UserProfile | None) -> Thresholds:
    if not profile:
        return DEFAULT_THRESHOLDS["other"]
    default = DEFAULT_THRESHOLDS.get((profile.boat_type or "other"), DEFAULT_THRESHOLDS["other"])
    return Thresholds(
        max_wind_kt=float(profile.max_wind_kt or default.max_wind_kt),
        max_gust_kt=float(profile.max_gust_kt or default.max_gust_kt),
        max_wave_height_ft=float(profile.max_wave_height_ft or default.max_wave_height_ft),
        min_tide_height_ft_mllw=(
            float(profile.min_tide_height_ft_mllw)
            if profile.min_tide_height_ft_mllw is not None
            else None
        ),
        daylight_only=bool(profile.daylight_only),
    )


def _confidence_penalty(
    forecast_age_min: int | None,
    buoy_age_min: int | None,
    tide_age_min: int | None,
    ramp_verified: bool,
    missing_wave: bool,
    mismatch: bool,
    critical_failed: bool,
) -> int:
    score = 100
    if forecast_age_min is not None and forecast_age_min > 120:
        score -= 20
    if buoy_age_min is not None and buoy_age_min > 120:
        score -= 15
    if tide_age_min is not None and tide_age_min > 60:
        score -= 15
    if missing_wave:
        score -= 15
    if not ramp_verified:
        score -= 10
    if mismatch:
        score -= 15
    if critical_failed:
        score -= 20
    return max(0, min(100, score))


def _label_confidence(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def _reason(
    severity: str,
    code: str,
    message: str,
    source: str,
    value: float | None = None,
    threshold: float | None = None,
) -> dict:
    payload = {"severity": severity, "code": code, "message": message, "source": source}
    if value is not None:
        payload["value"] = value
    if threshold is not None:
        payload["threshold"] = threshold
    return payload


def _evaluate_color(
    thresholds: Thresholds,
    forecast: WeatherForecast | None,
    observation: Observation | None,
    tide: TidePrediction | None,
    alerts: list[Alert],
    ramp: Ramp,
) -> tuple[str, float, list[dict], bool, bool, bool]:
    reasons: list[dict] = []

    if not forecast and not observation:
        reasons.append(
            _reason(
                "info",
                "missing_critical_data",
                "Critical forecast and observation data missing.",
                "rampready",
            )
        )
        return "gray", 20.0, reasons, True, True, False

    for alert in alerts:
        event = alert.event.lower()
        if event in SEVERE_ALERT_TERMS or (alert.severity or "").lower() in {"severe", "extreme"}:
            reasons.append(_reason("danger", "severe_alert", f"Active alert: {alert.event}", "NWS"))
            return "red", 5.0, reasons, False, False, False
        if "fog advisory" in event or "coastal flood advisory" in event:
            reasons.append(
                _reason("caution", "moderate_alert", f"Active advisory: {alert.event}", "NWS")
            )

    wind = (
        float(forecast.wind_speed_kt) if forecast and forecast.wind_speed_kt is not None else None
    )
    gust = float(forecast.wind_gust_kt) if forecast and forecast.wind_gust_kt is not None else None
    wave = (
        float(forecast.wave_height_ft) if forecast and forecast.wave_height_ft is not None else None
    )
    thunder = (
        float(forecast.thunderstorm_probability_pct)
        if forecast and forecast.thunderstorm_probability_pct is not None
        else None
    )

    obs_gust = (
        float(observation.wind_gust_kt)
        if observation and observation.wind_gust_kt is not None
        else None
    )
    obs_wave = (
        float(observation.wave_height_ft)
        if observation and observation.wave_height_ft is not None
        else None
    )

    if wind is not None and wind > thresholds.max_wind_kt:
        reasons.append(
            _reason(
                "danger",
                "wind_high",
                f"Wind {wind:.1f} kt exceeds limit.",
                "NWS",
                wind,
                thresholds.max_wind_kt,
            )
        )
        return "red", 20.0, reasons, False, wave is None, False
    if gust is not None and gust > thresholds.max_gust_kt:
        reasons.append(
            _reason(
                "danger",
                "gust_high",
                f"Gust {gust:.1f} kt exceeds limit.",
                "NWS",
                gust,
                thresholds.max_gust_kt,
            )
        )
        return "red", 20.0, reasons, False, wave is None, False
    if wave is not None and wave > thresholds.max_wave_height_ft:
        reasons.append(
            _reason(
                "danger",
                "wave_high",
                f"Wave {wave:.1f} ft exceeds limit.",
                "NWS",
                wave,
                thresholds.max_wave_height_ft,
            )
        )
        return "red", 20.0, reasons, False, False, False

    min_tide = thresholds.min_tide_height_ft_mllw
    if ramp.min_recommended_tide_ft_mllw is not None:
        min_tide = max(
            min_tide or float(ramp.min_recommended_tide_ft_mllw),
            float(ramp.min_recommended_tide_ft_mllw),
        )
    if min_tide is not None and tide and tide.tide_height_ft_mllw is not None:
        tide_h = float(tide.tide_height_ft_mllw)
        if tide_h < min_tide:
            reasons.append(
                _reason(
                    "danger",
                    "low_tide",
                    f"Tide {tide_h:.1f} ft below minimum.",
                    "NOAA CO-OPS",
                    tide_h,
                    min_tide,
                )
            )
            return "red", 20.0, reasons, False, wave is None, False
        if tide_h < min_tide + 0.3:
            reasons.append(
                _reason(
                    "caution",
                    "tide_near_min",
                    f"Tide near minimum: {tide_h:.1f} ft.",
                    "NOAA CO-OPS",
                    tide_h,
                    min_tide,
                )
            )

    if thunder is not None and thunder >= 50:
        reasons.append(
            _reason(
                "danger",
                "thunderstorm_risk",
                "Thunderstorm probability is high.",
                "NWS",
                thunder,
                50,
            )
        )
        return "red", 20.0, reasons, False, wave is None, False

    mismatch = False
    if obs_gust is not None and gust is not None and gust > 0 and obs_gust > gust * 1.25:
        mismatch = True
        if obs_gust > thresholds.max_gust_kt:
            reasons.append(
                _reason(
                    "danger",
                    "observed_gust_high",
                    f"Observed gust {obs_gust:.1f} kt exceeds your limit.",
                    "NDBC/CO-OPS",
                    obs_gust,
                    thresholds.max_gust_kt,
                )
            )
            return "red", 20.0, reasons, mismatch, wave is None, False
        reasons.append(
            _reason(
                "caution",
                "observed_gust_mismatch",
                "Observed gust is worse than forecast.",
                "NDBC/CO-OPS",
                obs_gust,
                gust,
            )
        )

    if obs_wave is not None and wave is not None and wave > 0 and obs_wave > wave * 1.3:
        mismatch = True
        if obs_wave > thresholds.max_wave_height_ft:
            reasons.append(
                _reason(
                    "danger",
                    "observed_wave_high",
                    f"Observed wave {obs_wave:.1f} ft exceeds your limit.",
                    "NDBC",
                    obs_wave,
                    thresholds.max_wave_height_ft,
                )
            )
            return "red", 20.0, reasons, mismatch, False, False
        reasons.append(
            _reason(
                "caution",
                "observed_wave_mismatch",
                "Observed waves are worse than forecast.",
                "NDBC",
                obs_wave,
                wave,
            )
        )

    caution = False

    def near_limit(value: float | None, limit: float) -> bool:
        return value is not None and limit * 0.8 <= value <= limit

    if near_limit(wind, thresholds.max_wind_kt):
        reasons.append(
            _reason(
                "caution",
                "wind_near_limit",
                f"Wind is near your limit ({wind:.1f} kt).",
                "NWS",
                wind,
                thresholds.max_wind_kt,
            )
        )
        caution = True
    if near_limit(gust, thresholds.max_gust_kt):
        reasons.append(
            _reason(
                "caution",
                "gust_near_limit",
                f"Gust is near your limit ({gust:.1f} kt).",
                "NWS",
                gust,
                thresholds.max_gust_kt,
            )
        )
        caution = True
    if near_limit(wave, thresholds.max_wave_height_ft):
        reasons.append(
            _reason(
                "caution",
                "wave_near_limit",
                f"Wave is near your limit ({wave:.1f} ft).",
                "NWS",
                wave,
                thresholds.max_wave_height_ft,
            )
        )
        caution = True

    if any(r["severity"] == "caution" for r in reasons):
        caution = True

    if caution or mismatch:
        if not reasons:
            reasons.append(
                _reason(
                    "caution",
                    "borderline_conditions",
                    "Some factors are close to limits.",
                    "rampready",
                )
            )
        return "yellow", 60.0, reasons, mismatch, wave is None, False

    reasons.append(
        _reason(
            "good", "conditions_ok", "Conditions are below your configured limits.", "rampready"
        )
    )
    if wind is not None:
        reasons.append(
            _reason(
                "good",
                "wind_ok",
                f"Wind {wind:.1f} kt is below your limit.",
                "NWS",
                wind,
                thresholds.max_wind_kt,
            )
        )
    return "green", 85.0, reasons, mismatch, wave is None, False


def build_launch_windows(
    db: Session, ramp: Ramp, user_profile_id: str | None, days: int = 7
) -> list[LaunchScore]:
    profile = db.get(UserProfile, user_profile_id) if user_profile_id else None
    thresholds = _thresholds_for_profile(profile)

    forecasts = list(
        db.scalars(
            select(WeatherForecast)
            .where(WeatherForecast.ramp_id == ramp.id)
            .order_by(WeatherForecast.valid_time.asc())
            .limit(days * 8)
        )
    )
    observations = list(
        db.scalars(select(Observation).order_by(Observation.observed_at.desc()).limit(8))
    )
    tides = list(
        db.scalars(
            select(TidePrediction).order_by(TidePrediction.predicted_at.asc()).limit(days * 8)
        )
    )
    alerts = list(
        db.scalars(select(Alert).where((Alert.ramp_id == ramp.id) | (Alert.ramp_id.is_(None))))
    )

    start = _window_start_floor(datetime.now(timezone.utc))
    windows: list[LaunchScore] = []

    for i in range(days * 8):
        w_start = start + timedelta(hours=3 * i)
        w_end = w_start + timedelta(hours=3)

        forecast = next(
            (
                f
                for f in forecasts
                if (
                    (_ensure_utc(f.valid_time) is not None and _ensure_utc(f.valid_time) <= w_end)
                    and (
                        _ensure_utc(f.valid_until) is None or _ensure_utc(f.valid_until) >= w_start
                    )
                )
            ),
            None,
        )
        tide = next(
            (
                t
                for t in tides
                if (
                    _ensure_utc(t.predicted_at) is not None
                    and _ensure_utc(t.predicted_at) <= w_end
                    and _ensure_utc(t.predicted_at) >= w_start - timedelta(hours=3)
                )
            ),
            None,
        )
        observation = observations[0] if observations else None

        color, score, reasons, mismatch, missing_wave, critical_failed = _evaluate_color(
            thresholds=thresholds,
            forecast=forecast,
            observation=observation,
            tide=tide,
            alerts=alerts,
            ramp=ramp,
        )

        def age_minutes(dt: datetime | None) -> int | None:
            dt_utc = _ensure_utc(dt)
            if not dt_utc:
                return None
            return int((datetime.now(timezone.utc) - dt_utc).total_seconds() // 60)

        forecast_age = age_minutes(forecast.created_at if forecast else None)
        buoy_age = age_minutes(observation.observed_at if observation else None)
        tide_age = age_minutes(tide.predicted_at if tide else None)
        confidence = _confidence_penalty(
            forecast_age_min=forecast_age,
            buoy_age_min=buoy_age,
            tide_age_min=tide_age,
            ramp_verified=ramp.manually_verified_at is not None,
            missing_wave=missing_wave,
            mismatch=mismatch,
            critical_failed=critical_failed,
        )

        if color == "green" and confidence < 70:
            color = "yellow"
            reasons.append(
                _reason(
                    "caution",
                    "confidence_medium",
                    "Data confidence is below high threshold.",
                    "rampready",
                    confidence,
                    70,
                )
            )
        if confidence < 30 and color != "red":
            color = "gray"
            reasons.append(
                _reason(
                    "info",
                    "low_confidence",
                    "Not enough fresh data for a responsible score.",
                    "rampready",
                    confidence,
                    30,
                )
            )

        source_summary = {
            "weather": {
                "source": forecast.source if forecast else "NWS forecastGridData",
                "updated_at": forecast.created_at.isoformat() if forecast else None,
                "freshness_minutes": forecast_age,
            },
            "alerts": {
                "source": "NWS active alerts",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "active_count": len(alerts),
            },
            "tide": {
                "source": "NOAA CO-OPS",
                "station_id": "unknown",
                "station_name": "Unknown",
                "distance_nm": None,
                "updated_at": tide.predicted_at.isoformat() if tide else None,
            },
            "buoy": {
                "source": "NOAA National Data Buoy Center",
                "station_id": "unknown",
                "station_name": "Unknown",
                "distance_nm": None,
                "observed_at": observation.observed_at.isoformat() if observation else None,
            },
            "confidence": {
                "score": confidence,
                "label": _label_confidence(confidence),
            },
        }

        window = LaunchScore(
            ramp_id=ramp.id,
            user_profile_id=user_profile_id,
            starts_at=w_start,
            ends_at=w_end,
            color=color,
            score=score,
            confidence_score=confidence,
            reasons=reasons,
            source_summary=source_summary,
            thresholds={
                "max_wind_kt": thresholds.max_wind_kt,
                "max_gust_kt": thresholds.max_gust_kt,
                "max_wave_height_ft": thresholds.max_wave_height_ft,
                "min_tide_height_ft_mllw": thresholds.min_tide_height_ft_mllw,
                "daylight_only": thresholds.daylight_only,
            },
        )
        windows.append(window)

    return windows
