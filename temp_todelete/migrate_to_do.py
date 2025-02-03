import os
import json
import logging
from datetime import datetime
from app import create_app, db
from app.models.mod import Mod
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
            
            # Process tracks/mods
            logging.info("Starting tracks/mods migration...")
            tracks_path = os.path.join('static', 'data', 'tracks.json')
            if os.path.exists(tracks_path):
                try:
                    with open(tracks_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Convert dictionary to list of items
                    items = list(data.values())
                    total_items = len(items)
                    logging.info(f"Found {total_items} items to migrate")
                    
                    success_count = 0
                    for i, batch in enumerate(process_in_batches(items)):
                        try:
                            for item in batch:
                                try:
                                    # Create mod from item data
                                    mod = Mod.from_dict(item)
                                    db.session.add(mod)
                                    success_count += 1
                                except Exception as e:
                                    logging.warning(f"Error processing item {item.get('title', 'unknown')}: {str(e)}")
                                    continue
                            db.session.commit()
                            logging.info(f"Migrated batch {i+1}")
                        except SQLAlchemyError as e:
                            db.session.rollback()
                            logging.error(f"Error in batch {i+1}: {str(e)}")
                            continue
                    
                    logging.info(f"Successfully migrated {success_count} out of {total_items} items")
                    
                except Exception as e:
                    logging.error(f"Error processing data: {str(e)}")
            else:
                logging.warning("No tracks.json file found")
            
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
