import pytest
from app.services.auth_service import create_user, authenticate_user
from app import db
from app.models.user import User
from werkzeug.security import check_password_hash

def test_create_user(init_database):
    new_user_data = {
        'username': 'newuser2',
        'password': 'securepassword',
        'email': 'newuser2@example.com'
    }
    new_user = create_user(new_user_data)
    assert new_user is not None
    assert new_user.username == 'newuser2'
    assert check_password_hash(new_user.password_hash, 'securepassword')

    # Test creating a duplicate user
    duplicate_user = create_user(new_user_data)
    assert duplicate_user is None

def test_authenticate_user(init_database):
    token = authenticate_user('testuser1', 'hash1')  # Assuming 'hash1' is the correct password
    assert token is not None

    # Test authentication with incorrect password
    token = authenticate_user('testuser1', 'wrongpassword')
    assert token is None

    # Test authentication of non-existent user
    token = authenticate_user('nonexistentuser', 'password')
    assert token is None