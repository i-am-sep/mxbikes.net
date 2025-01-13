from app import create_app, db
import os

app = create_app()

# Create a context to push onto the stack
with app.app_context():
    # Check if the database exists, if not create it
    if not os.path.exists(os.path.join(app.root_path, 'site.db')):
        db.create_all()
        print("Database created!")
    else:
        print("Database already exists!")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)