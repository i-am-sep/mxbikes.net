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
        # Parse JSON strings into Python dictionaries
        images_dict = json.loads(self.images) if self.images else {}
        
        try:
            downloads_dict = json.loads(self.downloads) if self.downloads else {}
        except (json.JSONDecodeError, TypeError):
            downloads_dict = {}
        
        # Initialize an empty list for all links
        all_links = []
        
        # Ensure downloads is a dictionary
        if not isinstance(downloads_dict, dict):
            downloads_dict = {}
            
        # Process by_type structure
        if 'by_type' in downloads_dict:
            for type_links in downloads_dict['by_type'].values():
                if isinstance(type_links, list):
                    all_links.extend(type_links)
                    
        # Process by_host structure
        if 'by_host' in downloads_dict:
            for host_links in downloads_dict['by_host'].values():
                if isinstance(host_links, list):
                    all_links.extend(host_links)
                    
        # Process direct links array if it exists
        if 'links' in downloads_dict and isinstance(downloads_dict['links'], list):
            all_links.extend(downloads_dict['links'])
            
        # If no links were found in any structure, initialize default structure
        if not downloads_dict:
            downloads_dict = {
                'by_type': {'other': []},
                'by_host': {},
                'download_count': 0
            }
            
        # Always ensure links array exists with all collected links
        downloads_dict['links'] = list(set(all_links))  # Remove duplicates
        
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
