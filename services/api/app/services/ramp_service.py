from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.entities import (
    Alert,
    LaunchScore,
    Observation,
    Ramp,
    RampReport,
    SavedRamp,
    TidePrediction,
    User,
    WeatherForecast,
)
from app.scoring.launch_score import build_launch_windows


def list_ramps(
    db: Session,
    region: str | None,
    q: str | None,
    near_lat: float | None,
    near_lon: float | None,
    limit: int,
) -> list[Ramp]:
    query = select(Ramp)
    if q:
        query = query.where(Ramp.name.ilike(f"%{q}%"))
    if region:
        query = query.where(or_(Ramp.state.ilike(f"%{region}%"), Ramp.city.ilike(f"%{region}%")))
    if near_lat is not None and near_lon is not None:
        lat_window = 1.0
        lon_window = 1.0
        query = query.where(
            and_(
                Ramp.latitude.between(near_lat - lat_window, near_lat + lat_window),
                Ramp.longitude.between(near_lon - lon_window, near_lon + lon_window),
            )
        )
    return list(db.scalars(query.order_by(Ramp.name.asc()).limit(limit)))


def get_ramp_or_404(db: Session, ramp_id: str) -> Ramp:
    ramp = db.get(Ramp, ramp_id)
    if not ramp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ramp not found")
    return ramp


def get_ramp_conditions(db: Session, ramp_id: str) -> dict:
    _ = get_ramp_or_404(db, ramp_id)
    latest_forecast = db.scalar(
        select(WeatherForecast)
        .where(WeatherForecast.ramp_id == ramp_id)
        .order_by(WeatherForecast.valid_time.desc())
        .limit(1)
    )
    latest_tide = db.scalar(
        select(TidePrediction).order_by(TidePrediction.predicted_at.desc()).limit(1)
    )
    latest_obs = db.scalar(select(Observation).order_by(Observation.observed_at.desc()).limit(1))
    alerts = list(
        db.scalars(select(Alert).where(or_(Alert.ramp_id == ramp_id, Alert.ramp_id.is_(None))))
    )

    def freshness(dt: datetime | None) -> int | None:
        if not dt:
            return None
        return int((datetime.now(timezone.utc) - dt).total_seconds() // 60)

    return {
        "latest_observation": latest_obs,
        "latest_forecast": latest_forecast,
        "latest_tide_prediction": latest_tide,
        "active_alerts": alerts,
        "source_freshness": {
            "forecast_minutes": freshness(latest_forecast.created_at if latest_forecast else None),
            "observation_minutes": freshness(latest_obs.observed_at if latest_obs else None),
            "tide_minutes": freshness(latest_tide.predicted_at if latest_tide else None),
        },
    }


def save_ramp_for_user(db: Session, user: User, ramp_id: str) -> SavedRamp:
    get_ramp_or_404(db, ramp_id)
    existing = db.scalar(
        select(SavedRamp).where(SavedRamp.user_id == user.id, SavedRamp.ramp_id == ramp_id)
    )
    if existing:
        return existing

    current_count = (
        db.scalar(select(func.count(SavedRamp.id)).where(SavedRamp.user_id == user.id)) or 0
    )
    limit = 20 if user.subscription_tier == "pro" else 1
    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Saved ramp limit reached ({limit}) for {user.subscription_tier} tier",
        )

    saved = SavedRamp(user_id=user.id, ramp_id=ramp_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


def remove_saved_ramp(db: Session, user: User, ramp_id: str) -> None:
    saved = db.scalar(
        select(SavedRamp).where(SavedRamp.user_id == user.id, SavedRamp.ramp_id == ramp_id)
    )
    if not saved:
        return
    db.delete(saved)
    db.commit()


def get_saved_ramps(db: Session, user: User) -> list[SavedRamp]:
    return list(
        db.scalars(
            select(SavedRamp)
            .where(SavedRamp.user_id == user.id)
            .order_by(SavedRamp.created_at.desc())
        )
    )


def create_ramp_report(
    db: Session,
    user_id: str | None,
    ramp_id: str,
    report_type: str,
    message: str | None,
    photo_url: str | None,
) -> RampReport:
    get_ramp_or_404(db, ramp_id)
    report = RampReport(
        user_id=user_id,
        ramp_id=ramp_id,
        report_type=report_type,
        message=message,
        photo_url=photo_url,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_launch_windows(
    db: Session, ramp_id: str, profile_id: str | None = None, days: int = 7
) -> list[LaunchScore]:
    ramp = get_ramp_or_404(db, ramp_id)

    existing = list(
        db.scalars(
            select(LaunchScore)
            .where(LaunchScore.ramp_id == ramp.id, LaunchScore.user_profile_id == profile_id)
            .order_by(LaunchScore.starts_at.asc())
        )
    )
    if existing:
        return existing

    windows = build_launch_windows(db=db, ramp=ramp, user_profile_id=profile_id, days=days)
    db.add_all(windows)
    db.commit()
    for w in windows:
        db.refresh(w)
    return windows
