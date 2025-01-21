from flask_sqlalchemy import SQLAlchemy
from .product import Product
from .user import User
from .download import Download
from .guid import GUID

db = SQLAlchemy()