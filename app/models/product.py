from ..extensions import db

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    file_path = db.Column(db.String(255))
    mod_type = db.Column(db.String(20))  # 'free' or 'paid'
    guid_required = db.Column(db.Boolean)
    download_count = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer)  # Assuming a foreign key to a User model
    password_release_time = db.Column(db.DateTime)

    def __repr__(self):
        return f"<Product {self.name}>"