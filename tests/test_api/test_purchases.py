import json

def test_purchase(test_client, init_database):
    purchase_data = {
        'product_id': 2,
        'user_id': 1
    }
    response = test_client.post('/api/auth/purchase', json=purchase_data)
    # Assuming successful purchase returns 200
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Purchase successful'

def test_failed_purchase(test_client, init_database):
    purchase_data = {
        'product_id': 999,  # Invalid product ID
        'user_id': 1
    }
    response = test_client.post('/api/auth/purchase', json=purchase_data)
    assert response.status_code == 400