import json

def test_register_user(test_client, init_database):
    new_user = {
        'username': 'newuser',
        'password': 'password123',
        'email': 'newuser@example.com'
    }
    response = test_client.post('/api/users', json=new_user)
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'user_id' in data

    # Test duplicate user registration
    response = test_client.post('/api/users', json=new_user)
    assert response.status_code == 400