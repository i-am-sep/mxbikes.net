import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def create_app(template_folder=None, instance_path=None):
    app = Flask(__name__, instance_relative_config=True)
    if instance_path:
        app.instance_path = instance_path
    if template_folder:
        app.template_folder = template_folder

    # Create an instance of the Config class
    config_object = Config()  
    app.config.from_object(config_object) 
    print("Configuration loaded successfully.")

    # Check for required config values
    required_configs = ['SQLALCHEMY_DATABASE_URI', 'SECRET_KEY']
    missing_configs = [config for config in required_configs if config not in app.config]
    if missing_configs:
        print(f"Error: Missing configuration values: {missing_configs}")
        return None

    print(f"Instance Path: {app.instance_path}")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"Template Folder: {app.template_folder}")

    try:
        db.init_app(app)
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        return None

    try:
        from app.api import api_blueprint
        app.register_blueprint(api_blueprint)
        print("Blueprint registered successfully.")
    except Exception as e:
        print(f"Error registering blueprint: {e}")
        return None

    return app