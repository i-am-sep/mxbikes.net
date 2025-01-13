import json

def test_free_download(test_client, init_database):
    response = test_client.get('/api/free_download/1')
    assert response.status_code == 200

def test_get_password(test_client, init_database):
    # Assuming product 2 requires authorization
    response = test_client.get('/api/password/2')
    assert response.status_code == 403  # Should be 403 or 200 based on your logic

def test_unauthorized_download(test_client, init_database):
    response = test_client.get('/api/free_download/999')
    assert response.status_code == 403