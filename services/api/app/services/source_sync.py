from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.clients.coops_client import CoopsClient, load_coops_fixture
from app.clients.ndbc_client import NdbcClient, load_ndbc_fixture
from app.clients.nws_client import NWSClient, load_nws_fixture
from app.models.entities import Alert, Observation, Ramp, Station, TidePrediction, WeatherForecast
from app.services.async_utils import run_coro_sync


def _parse_coops_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace(" ", "T") + "+00:00").astimezone(timezone.utc)


async def refresh_ramp_sources_async(db: Session, ramp: Ramp, use_fixture: bool = False) -> dict:
    now = datetime.now(timezone.utc)

    if use_fixture:
        hourly_payload = load_nws_fixture("nws_grid.json")
        alert_payload = load_nws_fixture("nws_alerts.json")
    else:
        nws = NWSClient()
        try:
            points = await nws.get_points(float(ramp.latitude), float(ramp.longitude))
            props = points.get("properties", {})
            grid_id = props.get("gridId", "TBW")
            grid_x = props.get("gridX", 80)
            grid_y = props.get("gridY", 62)
            hourly_payload = await nws.get_hourly(grid_id, grid_x, grid_y)
            alert_payload = await nws.get_alerts(float(ramp.latitude), float(ramp.longitude))
        except Exception:
            hourly_payload = load_nws_fixture("nws_grid.json")
            alert_payload = load_nws_fixture("nws_alerts.json")

    nws = NWSClient()
    periods = hourly_payload.get("properties", {}).get("periods", [])[:56]
    db.query(WeatherForecast).filter(WeatherForecast.ramp_id == ramp.id).delete()
    for period in periods:
        normalized = nws.normalize_hourly_period(period)
        wf = WeatherForecast(
            ramp_id=ramp.id,
            station_id=None,
            source="NWS forecastGridData",
            forecast_generated_at=now,
            valid_time=datetime.fromisoformat(normalized["valid_time"].replace("Z", "+00:00")),
            valid_until=(
                datetime.fromisoformat(normalized["valid_until"].replace("Z", "+00:00"))
                if normalized["valid_until"]
                else None
            ),
            wind_speed_kt=normalized["wind_speed_kt"],
            wind_gust_kt=normalized["wind_gust_kt"],
            wind_direction_deg=normalized["wind_direction_deg"],
            precipitation_probability_pct=normalized["precipitation_probability_pct"],
            weather_summary=normalized["weather_summary"],
            raw_payload=normalized["raw_payload"],
        )
        db.add(wf)

    db.query(Alert).filter(Alert.ramp_id == ramp.id).delete(synchronize_session=False)
    for feature in alert_payload.get("features", []):
        props = feature.get("properties", {})
        source_alert_id = (
            props.get("id")
            or props.get("@id")
            or props.get("event") + "-" + now.isoformat()
        )
        existing_alert = db.scalar(select(Alert).where(Alert.source_alert_id == source_alert_id))
        if existing_alert:
            source_alert_id = f"{source_alert_id}-{ramp.id}"
        alert = Alert(
            source="nws",
            source_alert_id=source_alert_id,
            ramp_id=ramp.id,
            event=props.get("event", "Unknown Alert"),
            headline=props.get("headline"),
            description=props.get("description"),
            instruction=props.get("instruction"),
            severity=props.get("severity"),
            certainty=props.get("certainty"),
            urgency=props.get("urgency"),
            area_desc=props.get("areaDesc"),
            effective_at=(
                datetime.fromisoformat(props["effective"].replace("Z", "+00:00"))
                if props.get("effective")
                else None
            ),
            expires_at=(
                datetime.fromisoformat(props["expires"].replace("Z", "+00:00"))
                if props.get("expires")
                else None
            ),
            ends_at=(
                datetime.fromisoformat(props["ends"].replace("Z", "+00:00"))
                if props.get("ends")
                else None
            ),
            raw_payload=props,
        )
        db.add(alert)

    station = db.scalar(
        select(Station).where(
            Station.provider == "coops",
            Station.provider_station_id == "8726520",
            Station.station_type == "tide",
        )
    )
    if not station:
        station = Station(
            provider="coops",
            provider_station_id="8726520",
            station_type="tide",
            name="St. Petersburg",
            latitude=27.760,
            longitude=-82.626,
            source_url="https://api.tidesandcurrents.noaa.gov/",
        )
        db.add(station)
        db.flush()

    if use_fixture:
        coops_payload = load_coops_fixture("coops_predictions.json")
    else:
        coops = CoopsClient()
        begin_date = now.strftime("%Y%m%d")
        end_date = (now.replace(hour=23, minute=59, second=59)).strftime("%Y%m%d")
        try:
            coops_payload = await coops.get_predictions(
                station.provider_station_id,
                begin_date=begin_date,
                end_date=end_date,
                datum="MLLW",
            )
        except Exception:
            coops_payload = load_coops_fixture("coops_predictions.json")

    db.query(TidePrediction).filter(TidePrediction.station_id == station.id).delete(
        synchronize_session=False
    )
    for row in coops_payload.get("predictions", [])[:400]:
        try:
            predicted_at = _parse_coops_time(row["t"])
        except Exception:
            continue
        pred = TidePrediction(
            station_id=station.id,
            predicted_at=predicted_at,
            tide_height_ft_mllw=float(row["v"]) if row.get("v") else None,
            type=row.get("type") or "prediction",
            raw_payload=row,
        )
        db.add(pred)

    buoy_station = db.scalar(
        select(Station).where(
            Station.provider == "ndbc",
            Station.provider_station_id == "41002",
            Station.station_type == "buoy",
        )
    )
    if not buoy_station:
        buoy_station = Station(
            provider="ndbc",
            provider_station_id="41002",
            station_type="buoy",
            name="NDBC 41002",
            latitude=26.0,
            longitude=-78.0,
            source_url="https://www.ndbc.noaa.gov/",
        )
        db.add(buoy_station)
        db.flush()

    ndbc = NdbcClient()
    if use_fixture:
        txt = load_ndbc_fixture("ndbc_41002.txt")
        spec = load_ndbc_fixture("ndbc_41002.spec")
    else:
        try:
            txt = await ndbc.get_station_txt(str(buoy_station.provider_station_id))
            spec = await ndbc.get_station_spec(str(buoy_station.provider_station_id))
        except Exception:
            txt = load_ndbc_fixture("ndbc_41002.txt")
            spec = load_ndbc_fixture("ndbc_41002.spec")

    parsed_txt = ndbc.parse_txt_latest(txt)
    parsed_spec = ndbc.parse_spec_latest(spec)

    if parsed_txt:
        existing_obs = db.scalar(
            select(Observation).where(
                Observation.station_id == buoy_station.id,
                Observation.observed_at == parsed_txt["observed_at"],
                Observation.source == "ndbc",
            )
        )
        if existing_obs:
            db.delete(existing_obs)
            db.flush()
        obs = Observation(
            station_id=buoy_station.id,
            source="ndbc",
            observed_at=parsed_txt["observed_at"],
            wind_speed_kt=parsed_txt.get("wind_speed_kt"),
            wind_gust_kt=parsed_txt.get("wind_gust_kt"),
            wind_direction_deg=parsed_txt.get("wind_direction_deg"),
            wave_height_ft=parsed_txt.get("wave_height_ft") or parsed_spec.get("wave_height_ft"),
            dominant_period_sec=parsed_txt.get("dominant_period_sec")
            or parsed_spec.get("dominant_period_sec"),
            average_period_sec=parsed_txt.get("average_period_sec")
            or parsed_spec.get("average_period_sec"),
            mean_wave_direction_deg=parsed_txt.get("mean_wave_direction_deg")
            or parsed_spec.get("mean_wave_direction_deg"),
            air_temperature_f=parsed_txt.get("air_temperature_f"),
            water_temperature_f=parsed_txt.get("water_temperature_f"),
            pressure_mb=parsed_txt.get("pressure_mb"),
            raw_payload={
                "txt": parsed_txt.get("raw_payload"),
                "spec": parsed_spec.get("raw_payload"),
            },
        )
        db.add(obs)

    db.commit()

    return {
        "forecast_count": len(periods),
        "alerts_count": len(alert_payload.get("features", [])),
        "tide_predictions_count": len(coops_payload.get("predictions", [])),
        "ndbc_observation": bool(parsed_txt),
    }


def refresh_ramp_sources(db: Session, ramp: Ramp, use_fixture: bool = False) -> dict:
    return run_coro_sync(refresh_ramp_sources_async(db, ramp, use_fixture=use_fixture))
