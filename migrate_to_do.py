import os
import json
import ijson
import logging
import re
from datetime import datetime
from app import create_app, db
from app.models.mod import Mod
from app.models.track import Track
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)

def extract_url_from_description(description):
    """Extract URL from description text"""
    if not description:
        return None
        
    url_patterns = [
        r'https?://(?:www\.)?mediafire\.com/file/[^\s/]+/[^\s]+',
        r'https?://(?:www\.)?drive\.google\.com/file/d/[^\s/]+',
        r'https?://(?:www\.)?mega\.nz/[^\s]+',
        r'https?://(?:www\.)?1drv\.ms/[^\s]+'
    ]
    
    for pattern in url_patterns:
        match = re.search(pattern, description)
        if match:
            return match.group(0)
    return None

def extract_title_from_description(description):
    """Extract title from description text"""
    if not description:
        return None
        
    title_patterns = [
        r'Track Info\nTrack ID:\s*([^\n]+)',
        r'Welcome to\s+([^\n.!]+)',
        r'This is\s+([^\n.!]+)',
        r'Track name in game is\s+([^\n.!]+)',
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, description)
        if match:
            return match.group(1).strip()
            
    # Try first line after "Description"
    lines = description.split('\n')
    for i, line in enumerate(lines):
        if line.strip() == 'Description' and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line and next_line != 'Downloads':
                return next_line
                
    return None

def extract_creator_from_description(description):
    """Extract creator from description text"""
    if not description:
        return None
        
    creator_patterns = [
        r'by\s+([^\n.]+)',
        r'created by\s+([^\n.]+)',
        r'Author:\s*([^\n]+)',
        r'Support\s+([^\n!]+)!'
    ]
    
    for pattern in creator_patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            return match.group(1).strip()
            
    return None

def process_in_batches(items, batch_size=50):
    """Process items in batches to manage memory usage"""
    batch = []
    for item in items:
        batch.append(item)
        if len(batch) >= batch_size:
            yield batch
            batch = []
    if batch:
        yield batch

def load_json_with_ijson(filepath):
    """Load large JSON files using ijson for memory efficiency"""
    items = []
    try:
        with open(filepath, 'rb') as f:
            parser = ijson.parse(f)
            current_item = {}
            current_path = []
            
            for prefix, event, value in parser:
                if prefix == '' and event == 'start_array':
                    continue
                elif prefix == '' and event == 'end_array':
                    break
                    
                if event == 'start_map':
                    current_item = {}
                    current_path = []
                elif event == 'end_map':
                    if not current_path:  # Root level object
                        # Extract fields from description
                        description = current_item.get('description', '')
                        
                        # Get URL
                        url = current_item.get('url') or extract_url_from_description(description)
                        if not url:
                            url = f"https://mxbikes.net/mod/{len(items)}"
                            
                        # Get title
                        title = current_item.get('title') or extract_title_from_description(description)
                        if not title:
                            title = f"Track {len(items) + 1}"
                            
                        # Get creator
                        creator = current_item.get('creator') or extract_creator_from_description(description)
                        if not creator:
                            creator = "Unknown Creator"
                            
                        current_item.update({
                            'url': url,
                            'title': title,
                            'creator': creator,
                            'downloads': current_item.get('downloads', {
                                'by_type': {'other': [url]},
                                'by_host': {'mediafire': 1} if 'mediafire' in url else {'other': 1},
                                'download_count': 0
                            }),
                            'images': current_item.get('images', {
                                'cover': None,
                                'additional': []
                            }),
                            'embedded_videos': current_item.get('embedded_videos', [])
                        })
                        items.append(current_item)
                elif event == 'map_key':
                    current_path.append(value)
                else:
                    if current_path:
                        # Set nested value
                        target = current_item
                        for key in current_path[:-1]:
                            if key not in target:
                                target[key] = {}
                            target = target[key]
                        target[current_path[-1]] = value
                        current_path.pop()
                        
        return items
    except Exception as e:
        logging.error(f"Error parsing JSON file {filepath}: {str(e)}")
        raise

def migrate_to_digitalocean():
    """Migrate database to DigitalOcean with improved error handling and batch processing"""
    
    logging.info("Starting migration to DigitalOcean database")
    
    # Create app with production config
    app = create_app('production')
    
    with app.app_context():
        try:
            # Recreate tables
            logging.info("Dropping existing tables...")
            db.drop_all()
            logging.info("Creating new tables...")
            db.create_all()
            
            # Process tracks
            logging.info("Starting tracks migration...")
            tracks_path = os.path.join('static', 'data', 'tracks.json')
            if os.path.exists(tracks_path):
                try:
                    tracks_data = load_json_with_ijson(tracks_path)
                    total_tracks = len(tracks_data)
                    logging.info(f"Found {total_tracks} tracks to migrate")
                    
                    success_count = 0
                    for i, batch in enumerate(process_in_batches(tracks_data)):
                        try:
                            for track_data in batch:
                                try:
                                    track = Track.from_dict(track_data)
                                    db.session.add(track)
                                    success_count += 1
                                except Exception as e:
                                    logging.warning(f"Error processing track: {str(e)}")
                                    continue
                            db.session.commit()
                            logging.info(f"Migrated tracks batch {i+1}")
                        except SQLAlchemyError as e:
                            db.session.rollback()
                            logging.error(f"Error in tracks batch {i+1}: {str(e)}")
                            continue
                    logging.info(f"Successfully migrated {success_count} out of {total_tracks} tracks")
                except Exception as e:
                    logging.error(f"Error processing tracks: {str(e)}")
            else:
                logging.warning("No tracks.json file found")
                
            # Process mods
            logging.info("Starting mods migration...")
            mods_path = os.path.join('static', 'data', 'mods.json')
            if os.path.exists(mods_path):
                try:
                    mods_data = load_json_with_ijson(mods_path)
                    total_mods = len(mods_data)
                    logging.info(f"Found {total_mods} mods to migrate")
                    
                    success_count = 0
                    for i, batch in enumerate(process_in_batches(mods_data)):
                        try:
                            for mod_data in batch:
                                try:
                                    mod = Mod.from_dict(mod_data)
                                    db.session.add(mod)
                                    success_count += 1
                                except Exception as e:
                                    logging.warning(f"Error processing mod: {str(e)}")
                                    continue
                            db.session.commit()
                            logging.info(f"Migrated mods batch {i+1}")
                        except SQLAlchemyError as e:
                            db.session.rollback()
                            logging.error(f"Error in mods batch {i+1}: {str(e)}")
                            continue
                    logging.info(f"Successfully migrated {success_count} out of {total_mods} mods")
                except Exception as e:
                    logging.error(f"Error processing mods: {str(e)}")
            else:
                logging.warning("No mods.json file found")
            
            logging.info("Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Migration failed: {str(e)}")
            raise

if __name__ == '__main__':
    try:
        migrate_to_digitalocean()
    except Exception as e:
        logging.error(f"Migration script failed: {str(e)}")
        raise
