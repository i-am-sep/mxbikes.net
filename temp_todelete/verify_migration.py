from app import create_app, db
from app.models.mod import Mod

def verify_migration():
    app = create_app()
    with app.app_context():
        # Count total records
        total_count = Mod.query.count()
        print(f"Total records in database: {total_count}")
        
        # Sample a few records
        print("\nSample records:")
        for mod in Mod.query.limit(3):
            print(f"\nTitle: {mod.title}")
            print(f"Creator: {mod.creator}")
            print(f"URL: {mod.url}")

if __name__ == '__main__':
    verify_migration()
