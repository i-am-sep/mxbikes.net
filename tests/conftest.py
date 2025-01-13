import pytest
from app import create_app, db
from app.config import Config
from app.models.user import User
from app.models.product import Product

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory database for testing

@pytest.fixture(scope='module')
def test_client():
    flask_app = create_app(TestConfig)

    # Create a test client using the Flask application configured for testing
    with flask_app.test_client() as testing_client:
        # Establish an application context
        with flask_app.app_context():
            yield testing_client  # this is where the testing happens!

@pytest.fixture(scope='module')
def init_database(test_client):
    # Create the database and the database table
    db.create_all()

    # Insert user data
    user1 = User(username='testuser1', password_hash='hash1', email='test1@example.com')
    user2 = User(username='testuser2', password_hash='hash2', email='test2@example.com')
    db.session.add(user1)
    db.session.add(user2)

    # Insert product data
    product1 = Product(name='Test Product 1', description='Desc 1', price=10.0, file_path='path/to/file1.zip', mod_type='free', guid_required=False, download_count=0, user_id=1)
    product2 = Product(name='Test Product 2', description='Desc 2', price=20.0, file_path='path/to/file2.zip', mod_type='paid', guid_required=True, download_count=0, user_id=2)
    db.session.add(product1)
    db.session.add(product2)

    # Commit the changes for the users and products
    db.session.commit()

    yield db  # this is where the testing happens!

    db.drop_all()