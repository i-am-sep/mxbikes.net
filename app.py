from app import create_app

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all() #moved db create here to run only when run as script
    app.run(debug=True, port=8001)