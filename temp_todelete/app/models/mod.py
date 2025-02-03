from datetime import datetime
from app.extensions import db

class Mod(db.Model):
    __tablename__ = 'mods'

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    creator = db.Column(db.String(500))  # Increased from 100 to 500
    description = db.Column(db.Text)
    
    # Store complex nested data as JSON
    downloads = db.Column(db.JSON)  # Stores download links and count
    images = db.Column(db.JSON)     # Stores cover and additional images
    embedded_videos = db.Column(db.JSON, nullable=True)
    
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
        """Create model from dictionary with validation"""
        # Ensure required fields have values
        url = data.get('url')
        if not url or url == 'https://mxbikes.net/no-url':
            # Try to extract URL from description
            desc = data.get('description', '')
            if desc:
                import re
                url_patterns = [
                    r'https?://(?:www\.)?mediafire\.com/file/[^\s/]+/[^\s]+',
                    r'https?://(?:www\.)?drive\.google\.com/file/d/[^\s/]+',
                    r'https?://(?:www\.)?mega\.nz/[^\s]+',
                    r'https?://(?:www\.)?1drv\.ms/[^\s]+'
                ]
                for pattern in url_patterns:
                    match = re.search(pattern, desc)
                    if match:
                        url = match.group(0)
                        break
            
            if not url or url == 'https://mxbikes.net/no-url':
                raise ValueError("Valid URL is required")
            
        title = data.get('title')
        if not title or title == 'Untitled Track':
            # Try to extract title from description
            desc = data.get('description', '')
            if desc:
                # Look for title in common patterns
                title_patterns = [
                    r'Track Info\nTrack ID:\s*([^\n]+)',
                    r'Welcome to\s+([^\n.!]+)',
                    r'This is\s+([^\n.!]+)',
                    r'Track name in game is\s+([^\n.!]+)',
                ]
                for pattern in title_patterns:
                    import re
                    match = re.search(pattern, desc)
                    if match:
                        title = match.group(1).strip()
                        break
                
                # If no pattern match, try first line after "Description"
                if not title or title == 'Untitled Track':
                    lines = desc.split('\n')
                    for i, line in enumerate(lines):
                        if line.strip() == 'Description' and i + 1 < len(lines):
                            next_line = lines[i + 1].strip()
                            if next_line and next_line != 'Downloads':
                                title = next_line
                                break

            if not title or title == 'Untitled Track':
                # Use filename from URL as last resort
                if url:
                    filename = url.split('/')[-1].split('.')[0]
                    title = filename.replace('_', ' ').replace('-', ' ').title()

        # Extract creator if not present
        creator = data.get('creator')
        if not creator or creator == 'Unknown Creator':
            desc = data.get('description', '')
            if desc:
                creator_patterns = [
                    r'by\s+([^\n.]+)',
                    r'created by\s+([^\n.]+)',
                    r'Author:\s*([^\n]+)',
                    r'Support\s+([^\n!]+)!'
                ]
                for pattern in creator_patterns:
                    match = re.search(pattern, desc, re.IGNORECASE)
                    if match:
                        creator = match.group(1).strip()
                        break

        # Process downloads data
        downloads_data = data.get('downloads')
        if isinstance(downloads_data, str):
            try:
                import json
                downloads_data = json.loads(downloads_data)
            except:
                downloads_data = {
                    'by_type': {'other': [url]},
                    'by_host': {'mediafire': 1} if 'mediafire' in url else {'other': 1},
                    'download_count': 0
                }

        return Mod(
            url=url,
            title=title or 'Unknown Mod',
            creator=creator or 'Unknown Creator',
            description=data.get('description', ''),
            downloads=downloads_data,
            images=data.get('images', {'cover': None, 'additional': []}),
            embedded_videos=data.get('embedded_videos', [])
        )
