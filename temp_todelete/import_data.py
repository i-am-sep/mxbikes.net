import os
import json
from app import create_app, db
from app.models.track import Track
from app.models.mod import Mod

def load_json(filepath):
    """Load JSON data from file"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def import_data():
    """Import data from JSON files into MySQL database"""
    # Load JSON data
    tracks_data = load_json('static/data/tracks.json')
    mods_data = load_json('static/data/mods.json')
    
    if tracks_data and 'tracks' in tracks_data:
        print(f"Found {len(tracks_data['tracks'])} tracks")
        # Import tracks
        for track_data in tracks_data['tracks']:
            # Convert to Track model format
            track_dict = {
                'url': track_data['downloads'][0]['url'] if track_data.get('downloads') else '',  # Use first download URL as unique identifier
                'title': track_data['name'],
                'creator': track_data.get('creator', ''),
                'description': track_data.get('description', ''),
                'downloads': {
                    'by_type': {'other': [
                        {'url': dl['url'], 'type': dl['type']}
                        for dl in track_data.get('downloads', [])
                    ]},
                    'by_host': {},
                    'download_count': 0
                },
                'images': {
                    'cover': track_data.get('thumbnail'),
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
    
    if mods_data and 'mods' in mods_data:
        print(f"\nFound {len(mods_data['mods'])} mods")
        # Import mods
        for mod_data in mods_data['mods']:
            # Convert to Mod model format
            mod_dict = {
                'url': mod_data['downloads'][0]['url'] if mod_data.get('downloads') else '',
                'title': mod_data['name'],
                'creator': mod_data.get('creator', ''),
                'description': mod_data.get('description', ''),
                'downloads': {
                    'by_type': {'other': [
                        {'url': dl['url'], 'type': dl['type']}
                        for dl in mod_data.get('downloads', [])
                    ]},
                    'by_host': {},
                    'download_count': 0
                },
                'images': {
                    'cover': mod_data.get('thumbnail'),
                    'additional': []
                }
            }
            
            try:
                # Create mod instance
                mod = Mod(
                    url=mod_dict['url'],
                    title=mod_dict['title'],
                    creator=mod_dict['creator'],
                    description=mod_dict['description'],
                    downloads=mod_dict['downloads'],
                    images=mod_dict['images']
                )
                
                existing = Mod.query.filter_by(url=mod_dict['url']).first()
                if not existing:
                    db.session.add(mod)
                    db.session.commit()
                    print(f"Added mod: {mod.title}")
                else:
                    print(f"Mod already exists: {mod.title}")
            except Exception as e:
                db.session.rollback()
                print(f"Error adding mod {mod_dict['title']}: {str(e)}")
    
    print("\nData import completed!")

if __name__ == '__main__':
    # Create app with production config
    app = create_app('production')
    
    with app.app_context():
        import_data()
