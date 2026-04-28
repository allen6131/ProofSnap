from sqlalchemy import select

from app.models.entities import Ramp, User



def register(client, email='user@example.com', password='password123'):
    res = client.post('/auth/register', json={'email': email, 'password': password})
    assert res.status_code == 200
    return res.json()['access_token']



def test_saved_ramp_limit_free_user(client, db_session):
    token = register(client)
    ramp1 = Ramp(name='Ramp 1', latitude=27.9, longitude=-82.6, source='manual')
    ramp2 = Ramp(name='Ramp 2', latitude=27.8, longitude=-82.7, source='manual')
    db_session.add_all([ramp1, ramp2])
    db_session.commit()

    headers = {'Authorization': f'Bearer {token}'}

    first = client.post(f'/me/saved-ramps/{ramp1.id}', headers=headers)
    assert first.status_code == 200

    second = client.post(f'/me/saved-ramps/{ramp2.id}', headers=headers)
    assert second.status_code == 400



def test_admin_routes_reject_normal_user(client):
    token = register(client, email='normal@example.com')
    headers = {'Authorization': f'Bearer {token}'}
    res = client.get('/admin/ramps', headers=headers)
    assert res.status_code == 403
