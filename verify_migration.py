import os
import logging
from app import create_app, db
from app.models.mod import Mod
from app.models.track import Track

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('verification.log'),
        logging.StreamHandler()
    ]
)

def verify_migration():
    """Verify the database migration"""
    
    logging.info("Starting migration verification")
    
    # Create app with production config
    app = create_app('production')
    
    with app.app_context():
        try:
            # Check if tables exist
            logging.info("Checking database tables...")
            
            # Get track count
            track_count = Track.query.count()
            logging.info(f"Found {track_count} tracks in database")
            
            # Get sample tracks
            sample_tracks = Track.query.limit(5).all()
            logging.info("\nSample tracks:")
            for track in sample_tracks:
                logging.info(f"- {track.title} by {track.creator}")
            
            # Get mod count
            mod_count = Mod.query.count()
            logging.info(f"\nFound {mod_count} mods in database")
            
            # Get sample mods
            sample_mods = Mod.query.limit(5).all()
            logging.info("\nSample mods:")
            for mod in sample_mods:
                logging.info(f"- {mod.title} by {mod.creator}")
                
            logging.info("\nVerification completed successfully!")
            
        except Exception as e:
            logging.error(f"Verification failed: {str(e)}")
            raise

if __name__ == '__main__':
    try:
        verify_migration()
    except Exception as e:
        logging.error(f"Verification script failed: {str(e)}")
        raise
