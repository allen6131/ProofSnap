from datetime import datetime, timedelta, timezone

from app.models.entities import Observation, Ramp, Station, UserProfile, WeatherForecast


def _register_token(client, email="chat@example.com"):
    res = client.post("/auth/register", json={"email": email, "password": "password123"})
    assert res.status_code == 200
    login = client.post("/auth/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200
    return login.json()["access_token"]


def test_chat_requires_auth(client):
    res = client.post(
        "/chat/recommendations",
        json={"message": "where is the best spot to go fishing/boating today"},
    )
    assert res.status_code in {401, 403}


def test_chat_recommendation_fallback_includes_sources(client, db_session):
    token = _register_token(client)
    ramp = Ramp(
        name="Chat Demo Ramp",
        latitude=27.760,
        longitude=-82.626,
        source="manual",
        state="FL",
        city="St. Petersburg",
        confidence_score=85,
        bait_nearby=True,
        parking="Paved lot",
        restrooms=True,
    )
    db_session.add(ramp)
    db_session.commit()

    res = client.post(
        "/chat/recommendations",
        json={"message": "where is the best spot to go fishing/boating today", "candidate_limit": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["used_openai"] is False
    assert data["intent"] == "both"
    assert data["recommendations"]
    assert data["recommendations"][0]["name"] == "Chat Demo Ramp"
    assert data["sources"]
    assert "planning and awareness tool" in data["disclaimer"]
    assert any("FWC" in warning or "Fishing" in warning for warning in data["warnings"])
    assert "promise" in data["assistant_message"].lower()


def test_chat_ranks_red_candidate_below_safer_candidate(client, db_session):
    token = _register_token(client, "rank@example.com")
    safe = Ramp(
        name="Safer Ramp",
        latitude=27.7,
        longitude=-82.6,
        source="manual",
        state="FL",
        confidence_score=80,
    )
    windy = Ramp(
        name="Windy Ramp",
        latitude=27.8,
        longitude=-82.7,
        source="manual",
        state="FL",
        confidence_score=95,
    )
    station = Station(
        provider="ndbc",
        provider_station_id="test-buoy",
        station_type="buoy",
        name="Test Buoy",
    )
    db_session.add_all([safe, windy, station])
    db_session.flush()
    profile = db_session.query(UserProfile).first()
    now = (datetime.now(timezone.utc) + timedelta(hours=1)).replace(
        minute=0, second=0, microsecond=0
    )
    for offset in range(8):
        valid_time = now + timedelta(hours=3 * offset)
        db_session.add(
            WeatherForecast(
                ramp_id=safe.id,
                source="NWS forecastGridData",
                valid_time=valid_time,
                valid_until=valid_time + timedelta(hours=3),
                wind_speed_kt=5,
                wind_gust_kt=8,
                wave_height_ft=0.5,
                created_at=now,
            )
        )
        db_session.add(
            WeatherForecast(
                ramp_id=windy.id,
                source="NWS forecastGridData",
                valid_time=valid_time,
                valid_until=valid_time + timedelta(hours=3),
                wind_speed_kt=30,
                wind_gust_kt=35,
                wave_height_ft=4,
                created_at=now,
            )
        )
    db_session.add(
        Observation(
            station_id=station.id,
            source="ndbc",
            observed_at=now,
            wind_gust_kt=6,
            wave_height_ft=0.4,
        )
    )
    if profile:
        profile.daylight_only = False
    db_session.commit()

    import app.services.chat_recommendation_service as service_module

    async def no_refresh(*args, **kwargs):
        return {"skipped": True}

    original_refresh = service_module.refresh_ramp_sources_async
    service_module.refresh_ramp_sources_async = no_refresh
    try:
        res = client.post(
            "/chat/recommendations",
            json={"message": "which ramp looks safest for boating today", "candidate_limit": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
    finally:
        service_module.refresh_ramp_sources_async = original_refresh
    assert res.status_code == 200, res.text
    names = [rec["name"] for rec in res.json()["recommendations"]]
    assert names.index("Safer Ramp") < names.index("Windy Ramp")
