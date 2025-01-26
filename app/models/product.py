from ..extensions import db
import json

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    file_path = db.Column(db.String(255))
    product_type = db.Column(db.String(20))  # 'mod' or 'track'
    mod_type = db.Column(db.String(20))      # 'free' or 'paid'
    creator = db.Column(db.String(255))
    images = db.Column(db.Text)              # JSON string for image URLs
    downloads = db.Column(db.Text)           # JSON string for download links
    guid_required = db.Column(db.Boolean)
    download_count = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer)
    password_release_time = db.Column(db.DateTime)

    def to_dict(self):
        images_dict = json.loads(self.images) if self.images else {}
        downloads_dict = json.loads(self.downloads) if self.downloads else {}
        
        return {
            'id': self.id,
            'title': self.name,
            'description': self.description,
            'creator': self.creator,
            'images': images_dict,
            'downloads': downloads_dict,
            'type': self.product_type,
            'mod_type': self.mod_type,
            'download_count': self.download_count
        }

    def __repr__(self):
        return f"<Product {self.name}>"
