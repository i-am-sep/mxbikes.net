import os
os.environ['FLASK_ENV'] = 'production'

from app import create_app, db
from app.models.mod import Mod  # Import models to ensure they're registered
from app.models.track import Track

# Create app with production config
app = create_app('production')

with app.app_context():
    # Drop all tables and recreate them
    db.drop_all()
    db.create_all()
    print("MySQL database tables created successfully!")
