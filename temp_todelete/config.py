import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'ssl': {
                'ssl_mode': 'REQUIRED',
                'check_hostname': False
            },
            'connect_timeout': 60
        }
    }

config = {
    'development': Config,
    'production': Config,
    'default': Config
}
