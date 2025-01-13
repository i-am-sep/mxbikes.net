import pytest
from app.services.download_service import get_download_path, authorize_download
from app import db
from app.models.product import Product
from app.models.download import Download
from datetime import datetime, timedelta

def test_get_download_path(init_database):
    # Test with a free product
    path = get_download_path(1, paid=False)  # Assuming product 1 is free
    assert path == 'path/to/file1.zip'

    # Test with a paid product
    path = get_download_path(2, paid=True)  # Assuming product 2 is paid
    assert path == 'path/to/file2.zip'

    # Test with an invalid product ID
    path = get_download_path(999, paid=False)
    assert path is None

def test_authorize_download(init_database):
    # Test with a product that has a future release time
    future_time = datetime.utcnow() + timedelta(days=1)
    product = Product.query.get(2)  # Assuming product 2 is paid and has a password release time
    product.password_release_time = future_time
    db.session.commit()

    authorized, password = authorize_download(2)
    assert authorized is False
    assert password is None

    # Test with a product that has a past release time
    past_time = datetime.utcnow() - timedelta(days=1)
    product.password_release_time = past_time
    db.session.commit()

    authorized, password = authorize_download(2)
    assert authorized is True
    assert password is not None  # Replace with actual password retrieval logic

    # Test with an invalid product ID
    authorized, password = authorize_download(999)
    assert authorized is False
    assert password is None