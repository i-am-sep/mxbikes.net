import os
from flask import Flask
from config import Config, config
from app.extensions import db, init_extensions

def create_app(config_class=Config):
    # Ensure instance path exists and is absolute
    instance_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance'))
    
    # Create Flask app with explicit instance path
    app = Flask(__name__, instance_path=instance_path, 
                template_folder='../templates',  # Point to correct template directory
                static_folder='../static')       # Point to correct static directory
    
    # Load config
    if isinstance(config_class, str):
        app.config.from_object(config[config_class])
    else:
        app.config.from_object(config_class)
    
    # Ensure instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Initialize extensions
    init_extensions(app)

    # Register blueprints
    from app.api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api')

    # Register main routes blueprint
    from app.routes import main
    app.register_blueprint(main)

    # Register error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not Found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal Server Error'}, 500

    return app
