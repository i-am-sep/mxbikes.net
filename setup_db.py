from app import create_app, db
from app.models.user import User
from app.models.product import Product
from app.models.download import Download

def setup_database():
    app = create_app()
    with app.app_context():
        print("Database URL:", app.config['SQLALCHEMY_DATABASE_URI'])
        print("Creating database tables...")
        try:
            db.create_all()
            print("Database tables created successfully!")
            
            # Print existing tables
            print("\nCreated tables:")
            for table in db.metadata.tables.keys():
                print(f"- {table}")
        except Exception as e:
            print(f"Error creating database: {str(e)}")
            print(f"Error type: {type(e)}")
            raise

if __name__ == "__main__":
    setup_database()
