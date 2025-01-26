from datetime import datetime
from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB

class Track(db.Model):
    __tablename__ = 'tracks'

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    creator = db.Column(db.String(100))
    description = db.Column(db.Text)
    
    # Store complex nested data as JSON
    downloads = db.Column(JSONB)  # Stores download links and count
    images = db.Column(JSONB)     # Stores cover and additional images
    embedded_videos = db.Column(JSONB, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert model to dictionary matching JSON structure"""
        return {
            'url': self.url,
            'title': self.title,
            'creator': self.creator,
            'downloads': self.downloads or {
                'by_type': {'other': []},
                'by_host': {},
                'download_count': 0
            },
            'images': self.images or {
                'cover': None,
                'additional': []
            },
            'description': self.description,
            'embedded_videos': self.embedded_videos
        }

    @staticmethod
    def from_dict(data):
        """Create model from dictionary"""
        return Track(
            url=data.get('url'),
            title=data.get('title'),
            creator=data.get('creator'),
            description=data.get('description'),
            downloads=data.get('downloads'),
            images=data.get('images'),
            embedded_videos=data.get('embedded_videos')
        )
