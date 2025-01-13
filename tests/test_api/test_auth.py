import json

def test_login(test_client, init_database):
    login_data = {
        'username': 'testuser1',
        'password': 'hash1'
    }
    response = test_client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data

    # Test invalid login
    login_data = {
        'username': 'testuser1',
        'password': 'wrongpassword'
    }
    response = test_client.post('/api/auth/login', json=login_data)
    assert response.status_code == 401