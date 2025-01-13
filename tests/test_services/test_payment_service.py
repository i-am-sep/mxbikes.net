import pytest
from app.services.payment_service import process_payment

def test_process_payment_success(init_database):
    # Simulate a successful payment
    payment_data = {
        'product_id': 1,
        'user_id': 1,
        'amount': 10.00
    }
    success = process_payment(payment_data)
    assert success is True

def test_process_payment_failure(init_database):
    # Simulate a failed payment
    payment_data = {
        'product_id': 999,  # Invalid product ID
        'user_id': 1,
        'amount': 0.00
    }
    success = process_payment(payment_data)
    assert success is False