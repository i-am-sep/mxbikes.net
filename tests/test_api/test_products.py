import json

def test_list_products(test_client, init_database):
    response = test_client.get('/api/products')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2  # Assuming you have 2 products in the test database

def test_get_product(test_client, init_database):
    response = test_client.get('/api/products/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Test Product 1'

    response = test_client.get('/api/products/999')
    assert response.status_code == 404