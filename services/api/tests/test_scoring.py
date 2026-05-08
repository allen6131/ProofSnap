from datetime import datetime, timedelta, timezone

from app.models.entities import Alert, Observation, Ramp, TidePrediction, WeatherForecast
from app.scoring.launch_score import build_launch_windows


def _seed_base(db, wind=8, gust=12, wave=1.0, alert=None, tide=2.0, obs_gust=10, obs_wave=0.8):
    ramp = Ramp(
        name="Test Ramp",
        latitude=27.9,
        longitude=-82.6,
        source="manual",
        status="active",
        confidence_score=80,
    )
    db.add(ramp)
    db.flush()

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    db.add(
        WeatherForecast(
            ramp_id=ramp.id,
            source="NWS forecastGridData",
            valid_time=now,
            valid_until=now + timedelta(hours=3),
            wind_speed_kt=wind,
            wind_gust_kt=gust,
            wave_height_ft=wave,
            thunderstorm_probability_pct=10,
            created_at=now,
        )
    )
    db.add(
        Observation(
            station_id="station-1",
            source="ndbc",
            observed_at=now,
            wind_gust_kt=obs_gust,
            wave_height_ft=obs_wave,
        )
    )
    db.add(
        TidePrediction(
            station_id="tide-1",
            predicted_at=now,
            tide_height_ft_mllw=tide,
        )
    )
    if alert:
        db.add(
            Alert(
                source="nws",
                source_alert_id="alert-1",
                ramp_id=ramp.id,
                event=alert,
                severity="Severe" if "Warning" in alert else "Moderate",
            )
        )
    db.commit()
    db.refresh(ramp)
    return ramp


def test_scoring_green(db_session):
    ramp = _seed_base(db_session)
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].color in {"green", "yellow"}


def test_scoring_yellow_near_threshold(db_session):
    ramp = _seed_base(db_session, wind=14, gust=21, wave=1.9)
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].color == "yellow"


def test_scoring_red_wind_above_threshold(db_session):
    ramp = _seed_base(db_session, wind=20)
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].color == "red"


def test_scoring_red_small_craft_advisory(db_session):
    ramp = _seed_base(db_session, alert="Small Craft Advisory")
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].color == "red"


def test_scoring_yellow_stale_buoy(db_session):
    ramp = _seed_base(db_session)
    obs = db_session.query(Observation).first()
    obs.observed_at = datetime.now(timezone.utc) - timedelta(hours=3)
    db_session.commit()
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].confidence_score < 90


def test_scoring_gray_missing_critical(db_session):
    ramp = Ramp(
        name="No Data Ramp",
        latitude=27.9,
        longitude=-82.6,
        source="manual",
        status="active",
        confidence_score=70,
    )
    db_session.add(ramp)
    db_session.commit()
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].color == "gray"


def test_scoring_observed_worse_than_forecast_downgrade(db_session):
    ramp = _seed_base(db_session, wind=10, gust=12, wave=1.0, obs_gust=18)
    windows = build_launch_windows(db_session, ramp, None, days=1)
    assert windows[0].color in {"yellow", "red"}
