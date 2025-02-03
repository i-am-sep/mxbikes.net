from app import create_app, db
from app.models.user import User
from app.models.product import Product
from app.models.download import Download

app = create_app()

def init_db():
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

if __name__ == "__main__":
    app.run(debug=True, port=8001)
