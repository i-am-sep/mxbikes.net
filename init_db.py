import os
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.download import Download
from app.utils.json_parser import stream_json_objects, process_tracks_batch
from config import DevelopmentConfig
from sqlalchemy import inspect

def init_db(populate_data=True):
    # Get absolute path to instance directory using Windows-style separators
    base_dir = os.path.abspath(os.path.dirname(__file__))
    instance_path = os.path.join(base_dir, 'instance')
    db_file = os.path.join(instance_path, 'site.db')
    
    # Create instance directory if it doesn't exist
    try:
        if not os.path.exists(instance_path):
            os.makedirs(instance_path)
            print(f"Created instance directory at {instance_path}")
        else:
            print(f"Instance directory exists at {instance_path}")
        
        # Print directory contents
        print("\nInstance directory contents:")
        if os.path.exists(instance_path):
            files = os.listdir(instance_path)
            for f in files:
                print(f"- {f}")
        else:
            print("(empty)")
            
        # Verify instance directory is writable
        test_file = os.path.join(instance_path, 'test.txt')
        try:
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            print("\nInstance directory is writable")
        except Exception as e:
            print(f"\nWarning: Instance directory is not writable: {str(e)}")
            return False
    except Exception as e:
        print(f"\nError creating/verifying instance directory: {str(e)}")
        return False
    
    # Remove existing database file if it exists
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"\nRemoved existing database file")
        except Exception as e:
            print(f"\nWarning: Could not remove existing database file: {str(e)}")
    
    # Create and configure app with explicit development config
    app = create_app(DevelopmentConfig)
    
    # Print configuration details
    print(f"\nConfiguration details:")
    print(f"Base directory: {base_dir}")
    print(f"Instance path: {instance_path}")
    print(f"Database file: {db_file}")
    print(f"Database URI from config: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"App instance path: {app.instance_path}")
    
    with app.app_context():
        try:
            # Try to create database file explicitly
            try:
                open(db_file, 'w').close()
                print(f"\nSuccessfully created new database file at {db_file}")
            except Exception as e:
                print(f"\nWarning: Could not create database file explicitly: {str(e)}")
            
            # Create tables
            db.create_all()
            print("\nSuccessfully created database tables")
            
            # Verify tables were created using inspector
            inspector = inspect(db.engine)
            table_names = inspector.get_table_names()
            print("\nCreated tables:")
            for table in table_names:
                print(f"- {table}")
                columns = inspector.get_columns(table)
                for column in columns:
                    print(f"  - {column['name']}: {column['type']}")

            # Populate database with track data if requested
            if populate_data:
                tracks_file = os.path.join(base_dir, 'data', 'track_details.json')
                if os.path.exists(tracks_file):
                    print("\nPopulating database with track data...")
                    tracks_added = 0
                    
                    # Process tracks in batches
                    for batch in stream_json_objects(tracks_file, batch_size=10):
                        # Process and validate the batch
                        processed_tracks = process_tracks_batch(batch)
                        
                        # Add valid tracks to database
                        for track_data in processed_tracks:
                            try:
                                track = Product(**track_data)
                                db.session.add(track)
                                tracks_added += 1
                            except Exception as e:
                                print(f"Error adding track: {str(e)}")
                        
                        # Commit the batch
                        try:
                            db.session.commit()
                        except Exception as e:
                            print(f"Error committing batch: {str(e)}")
                            db.session.rollback()
                            
                    print(f"Successfully added {tracks_added} tracks to database")
                else:
                    print(f"\nTrack data file not found at {tracks_file}")
            
            return True
            
        except Exception as e:
            print(f"\nError creating database tables: {str(e)}")
            print(f"Current working directory: {os.getcwd()}")
            return False

if __name__ == '__main__':
    success = init_db()
    if not success:
        print("\nDatabase initialization failed")
    else:
        print("\nDatabase initialization completed successfully")
