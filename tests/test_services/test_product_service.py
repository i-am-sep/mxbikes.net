import pytest
from app.services.product_service import get_all_products, get_product_by_id
from app import db
from app.models.product import Product

def test_get_all_products(init_database):
    products = get_all_products()
    assert len(products) == 2  # Assuming 2 products were added in init_database

def test_get_product_by_id(init_database):
    product = get_product_by_id(1)
    assert product is not None
    assert product.name == 'Test Product 1'

    product = get_product_by_id(999)
    assert product is None