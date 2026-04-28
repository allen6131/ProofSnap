from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.entities import Alert, Observation, Ramp, TidePrediction, WeatherForecast

router = APIRouter(prefix='/sources', tags=['sources'])


@router.get('/status')
def source_status(db: Session = Depends(get_db)) -> dict:
    now = datetime.now(timezone.utc)
    latest_forecast = db.scalar(select(WeatherForecast).order_by(WeatherForecast.created_at.desc()).limit(1))
    latest_obs = db.scalar(select(Observation).order_by(Observation.observed_at.desc()).limit(1))
    latest_tide = db.scalar(select(TidePrediction).order_by(TidePrediction.predicted_at.desc()).limit(1))

    def age(dt):
        if not dt:
            return None
        return int((now - dt).total_seconds() // 60)

    return {
        'weather': {'source': 'NWS forecastGridData', 'updated_at': latest_forecast.created_at if latest_forecast else None, 'freshness_minutes': age(latest_forecast.created_at) if latest_forecast else None},
        'alerts': {'source': 'NWS active alerts', 'active_count': db.query(Alert).count(), 'checked_at': now},
        'tide': {'source': 'NOAA CO-OPS', 'updated_at': latest_tide.predicted_at if latest_tide else None, 'freshness_minutes': age(latest_tide.predicted_at) if latest_tide else None},
        'buoy': {'source': 'NOAA National Data Buoy Center', 'updated_at': latest_obs.observed_at if latest_obs else None, 'freshness_minutes': age(latest_obs.observed_at) if latest_obs else None},
    }


@router.get('/ramps/{ramp_id}/summary')
def ramp_source_summary(ramp_id: str, db: Session = Depends(get_db)) -> dict:
    ramp = db.get(Ramp, ramp_id)
    if not ramp:
        return {'error': 'Ramp not found'}

    latest_forecast = db.scalar(
        select(WeatherForecast).where(WeatherForecast.ramp_id == ramp_id).order_by(WeatherForecast.valid_time.desc()).limit(1)
    )
    alerts = list(db.scalars(select(Alert).where(Alert.ramp_id == ramp_id)))
    latest_obs = db.scalar(select(Observation).order_by(Observation.observed_at.desc()).limit(1))

    return {
        'ramp': {'id': ramp.id, 'name': ramp.name, 'source': ramp.source},
        'forecast': {'source': latest_forecast.source if latest_forecast else None, 'updated_at': latest_forecast.created_at if latest_forecast else None},
        'alerts': {'count': len(alerts), 'events': [a.event for a in alerts]},
        'observation': {'source': latest_obs.source if latest_obs else None, 'observed_at': latest_obs.observed_at if latest_obs else None},
    }
