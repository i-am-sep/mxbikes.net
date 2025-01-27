import os
import json
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.models.track import Track

# Create Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://doadmin:AVNS_2285GMMOL6jnvj0BjGY@dbaas-db-8731719-do-user-18540873-0.h.db.ondigitalocean.com:25060/defaultdb?ssl-mode=REQUIRED'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

def load_json(filepath):
    """Load JSON data from file"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def import_data():
    """Import data from JSON files into MySQL database"""
    # Load JSON data
    tracks_data = load_json('tracks.json')
    
    if tracks_data and 'tracks' in tracks_data:
        print(f"Found {len(tracks_data['tracks'])} tracks")
        # Import tracks
        for track_data in tracks_data['tracks']:
            # Convert to Track model format
            track_dict = {
                'url': track_data['downloads'][0]['url'],  # Use first download URL as unique identifier
                'title': track_data['name'],
                'creator': track_data['creator'],
                'description': '',  # No description in JSON
                'downloads': {
                    'by_type': {'other': [
                        {'url': dl['url'], 'type': dl['type']}
                        for dl in track_data['downloads']
                    ]},
                    'by_host': {},
                    'download_count': 0
                },
                'images': {
                    'cover': track_data['thumbnail'],
                    'additional': []
                }
            }
            
            try:
                # Create track instance
                track = Track(
                    url=track_dict['url'],
                    title=track_dict['title'],
                    creator=track_dict['creator'],
                    description=track_dict['description'],
                    downloads=track_dict['downloads'],
                    images=track_dict['images']
                )
                
                existing = Track.query.filter_by(url=track_dict['url']).first()
                if not existing:
                    db.session.add(track)
                    db.session.commit()
                    print(f"Added track: {track.title}")
                else:
                    print(f"Track already exists: {track.title}")
            except Exception as e:
                db.session.rollback()
                print(f"Error adding track {track_dict['title']}: {str(e)}")
    
    print("Data import completed!")

if __name__ == '__main__':
    with app.app_context():
        import_data()
