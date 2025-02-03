from ..extensions import db
from datetime import datetime

class Download(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    token = db.Column(db.String(255), unique=True)
    guid = db.Column(db.String(255))
    download_time = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Download {self.id} - User {self.user_id}, Product {self.product_id}>"