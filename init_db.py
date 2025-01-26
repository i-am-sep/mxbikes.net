import os
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.download import Download
from app.utils.json_parser import stream_json_objects
from config import DevelopmentConfig
from sqlalchemy import inspect
import json

def process_mod_data(mod):
    """Process a single mod/track entry from mods.json"""
    try:
        return {
            'name': mod.get('title', 'Untitled'),
            'description': mod.get('description', 'No description available'),
            'price': 0.0,  # Default to free
            'product_type': mod.get('type', 'track'),
            'mod_type': 'free',  # Default to free
            'creator': mod.get('creator', 'Unknown'),
            'images': json.dumps(mod.get('images', {})),
            'downloads': json.dumps(mod.get('downloads', {'links': []})),
            'guid_required': False,
            'download_count': 0
        }
    except Exception as e:
        print(f"Error processing mod data: {str(e)}")
        return None

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

            # Populate database with mods/tracks data if requested
            if populate_data:
                mods_file = os.path.join(base_dir, 'data', 'DO NOT OPEN', 'mods.json')
                if os.path.exists(mods_file):
                    print("\nPopulating database with mods/tracks data...")
                    items_added = 0
                    
                    # Process mods in batches
                    for batch in stream_json_objects(mods_file, batch_size=10):
                        for mod_data in batch:
                            try:
                                # Process the mod data
                                processed_data = process_mod_data(mod_data)
                                if processed_data:
                                    mod = Product(**processed_data)
                                    db.session.add(mod)
                                    items_added += 1
                            except Exception as e:
                                print(f"Error adding mod/track: {str(e)}")
                                continue
                        
                        # Commit the batch
                        try:
                            db.session.commit()
                        except Exception as e:
                            print(f"Error committing batch: {str(e)}")
                            db.session.rollback()
                            
                    print(f"Successfully added {items_added} items to database")
                else:
                    print(f"\nMods data file not found at {mods_file}")
            
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
