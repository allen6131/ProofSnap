from app.models.entities import Ramp


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_register_login_and_ramp_flow(client, db_session):
    register = client.post(
        "/auth/register", json={"email": "demo@example.com", "password": "password123"}
    )
    assert register.status_code == 200

    login = client.post(
        "/auth/login", json={"email": "demo@example.com", "password": "password123"}
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    ramp = Ramp(name="Demo Ramp", latitude=27.95, longitude=-82.45, source="manual", state="FL")
    db_session.add(ramp)
    db_session.commit()

    ramps = client.get("/ramps?q=Demo")
    assert ramps.status_code == 200
    assert len(ramps.json()) == 1

    detail = client.get(f"/ramps/{ramp.id}")
    assert detail.status_code == 200

    save = client.post(f"/me/saved-ramps/{ramp.id}", headers={"Authorization": f"Bearer {token}"})
    assert save.status_code == 200
