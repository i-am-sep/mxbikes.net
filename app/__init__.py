from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    # Load default configuration from config.py
    app.config.from_object('app.config')

    # Initialize Flask extensions here
    from .extensions import db
    db.init_app(app)

    # Register api blueprint here
    from .api import api_blueprint
    app.register_blueprint(api_blueprint)
    
    return app