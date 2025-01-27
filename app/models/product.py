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
        if 'by_type' in downloads_dict and isinstance(downloads_dict['by_type'], dict):
            for type_links in downloads_dict['by_type'].values():
                if isinstance(type_links, list):
                    all_links.extend(type_links)
                elif isinstance(type_links, str):
                    all_links.append(type_links)
                    
        # Process by_host structure
        if 'by_host' in downloads_dict and isinstance(downloads_dict['by_host'], dict):
            for host_links in downloads_dict['by_host'].values():
                if isinstance(host_links, list):
                    all_links.extend(host_links)
                elif isinstance(host_links, str):
                    all_links.append(host_links)
                    
        # Process direct links array if it exists
        if 'links' in downloads_dict:
            if isinstance(downloads_dict['links'], list):
                all_links.extend(downloads_dict['links'])
            elif isinstance(downloads_dict['links'], str):
                all_links.append(downloads_dict['links'])

        # Process single link if it exists
        if 'link' in downloads_dict and downloads_dict['link']:
            all_links.append(downloads_dict['link'])
                    
        # If no links were found in any structure, initialize default structure based on type
        if not downloads_dict:
            if self.product_type == 'mod':
                downloads_dict = {
                    'by_type': {'mod': []},
                    'by_host': {},
                    'download_count': 0
                }
            else:  # track
                downloads_dict = {
                    'by_type': {'other': []},
                    'by_host': {},
                    'download_count': 0
                }
            
        # Always ensure links array exists with all collected links
        downloads_dict['links'] = list(set(link for link in all_links if link))  # Remove duplicates and None/empty values
        
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
