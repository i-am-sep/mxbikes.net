from ..models.user import User
from ..models.guid import GUID
from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from config import Config
import uuid
from app.models import GUID
from app.extensions import db

def add_guid(discord_user_id, guid):
    new_guid = GUID(discord_user_id=discord_user_id, guid=guid)
    db.session.add(new_guid)
    db.session.commit()
    return new_guid


def create_user(data):
    if User.query.filter_by(username=data['username']).first():
        return None

    hashed_password = generate_password_hash(data['password'], method='sha256')
    new_user = User(username=data['username'], password_hash=hashed_password, email=data.get('email'))
    db.session.add(new_user)
    db.session.commit()
    return new_user

def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        # Generate a JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)  # Token expires in 24 hours
        }, Config.SECRET_KEY, algorithm='HS256')
        return token
    return None

def add_guid(discord_user_id, guid):
        new_guid = GUID(discord_user_id=discord_user_id, guid=guid)
        db.session.add(new_guid)
        db.session.commit()
        return new_guid