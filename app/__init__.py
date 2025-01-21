import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
from flask_migrate import Migrate
from .models import db #Import db from models folder

migrate = Migrate()

def create_app(test_config=None, template_folder=None, instance_path=None):
    app = Flask(__name__, instance_relative_config=True)
    if template_folder:
        app.template_folder = template_folder
    if instance_path:
        app.instance_path = instance_path

    app.config.from_envvar('FLASK_CONFIG') # Load config from environment variable

    db.init_app(app) # Initialize db *after* config is loaded
    migrate.init_app(app, db) #Initialize Migrate after db is initialized.


    from .api import api_blueprint #Import your blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api') #Register blueprint after config and db are initialized.

    #Check config values
    required_configs = ['SQLALCHEMY_DATABASE_URI', 'SECRET_KEY']
    missing_configs = [config for config in required_configs if config not in app.config]
    if missing_configs:
        print(f"Error: Missing configuration values: {missing_configs}")
        return None

    print(f"Instance Path: {app.instance_path}")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"Template Folder: {app.template_folder}")

    return app