import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    
    # Use simple direct path for SQLite database
    db_path = os.path.join(basedir, 'instance', 'site.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class StagingConfig(Config):
    DEBUG = True
    TESTING = False
    # Use staging-specific database
    db_path = os.path.join(basedir, 'instance', 'staging.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
    
class ProductionConfig(Config):
    DEBUG = False
    # Use database URL from environment variable with SSL config
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_timeout': 30,  # 30 seconds
        'pool_recycle': 3600,  # Recycle connections after 1 hour
        'pool_pre_ping': True,  # Enable connection health checks
        'connect_args': {
            'connect_timeout': 10,
            'read_timeout': 30,
            'write_timeout': 30,
            'ssl': {
                'verify_cert': False,  # Don't verify the self-signed certificate
                'ssl_mode': 'VERIFY_IDENTITY'
            }
        }
    }
    
class TestingConfig(Config):
    TESTING = True
    test_db_path = os.path.join(basedir, 'instance', 'test.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{test_db_path}'

config = {
    'development': DevelopmentConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
