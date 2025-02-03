from typing import List, Dict, Optional
import json
from ..models.product import Product
from ..models.mod import Mod
from ..models.track import Track
from ..extensions import db

def _ensure_downloads_structure(downloads_data: Optional[Dict]) -> Dict:
    """Ensure downloads data has the correct structure"""
    if not downloads_data:
        return {'links': [], 'download_count': 0}
    
    # If it's already a string (JSON), parse it
    if isinstance(downloads_data, str):
        try:
            downloads_data = json.loads(downloads_data)
        except json.JSONDecodeError:
            return {'links': [], 'download_count': 0}
    
    # Ensure it's a dictionary
    if not isinstance(downloads_data, dict):
        return {'links': [], 'download_count': 0}
    
    # Extract all links into a single array
    all_links = set()
    
    # Check by_type structure
    if 'by_type' in downloads_data and isinstance(downloads_data['by_type'], dict):
        for type_links in downloads_data['by_type'].values():
            if isinstance(type_links, list):
                all_links.update(link for link in type_links if isinstance(link, str))
    
    # Check by_host structure
    if 'by_host' in downloads_data and isinstance(downloads_data['by_host'], dict):
        for host_links in downloads_data['by_host'].values():
            if isinstance(host_links, list):
                all_links.update(link for link in host_links if isinstance(link, str))
    
    # Check direct links array
    if 'links' in downloads_data and isinstance(downloads_data['links'], list):
        all_links.update(link for link in downloads_data['links'] if isinstance(link, str))
    
    # Check single link
    if 'link' in downloads_data and isinstance(downloads_data['link'], str):
        all_links.add(downloads_data['link'])
    
    return {
        'links': sorted(list(all_links)),
        'download_count': downloads_data.get('download_count', 0)
    }

def _convert_mod_to_product(mod: Mod) -> Dict:
    """Convert a Mod model to Product dictionary format"""
    downloads = _ensure_downloads_structure(mod.downloads)
    
    # Handle images field that could be either string or dict
    images = mod.images
    if isinstance(images, str):
        try:
            images = json.loads(images)
        except json.JSONDecodeError:
            images = {}
    elif not isinstance(images, dict):
        images = {}
    
    return {
        'id': mod.id,
        'title': mod.title,
        'description': mod.description,
        'creator': mod.creator,
        'images': images,
        'downloads': downloads,
        'type': 'mod',
        'download_count': downloads.get('download_count', 0)
    }

def _convert_track_to_product(track: Track) -> Dict:
    """Convert a Track model to Product dictionary format"""
    downloads = _ensure_downloads_structure(track.downloads)
    
    # Handle images field that could be either string or dict
    images = track.images
    if isinstance(images, str):
        try:
            images = json.loads(images)
        except json.JSONDecodeError:
            images = {}
    elif not isinstance(images, dict):
        images = {}
    
    return {
        'id': track.id,
        'title': track.title,
        'description': track.description,
        'creator': track.creator,
        'images': images,
        'downloads': downloads,
        'type': 'track',
        'download_count': downloads.get('download_count', 0)
    }

def get_all_products() -> List[Dict]:
    """Get all products (mods and tracks) in unified format"""
    # Get all mods and tracks
    mods = Mod.query.all()
    tracks = Track.query.all()
    
    # Convert to product format
    products = []
    products.extend(_convert_mod_to_product(mod) for mod in mods)
    products.extend(_convert_track_to_product(track) for track in tracks)
    
    return products

def get_product_by_id(product_id: int) -> Optional[Dict]:
    """Get a specific product by ID"""
    # Try to find in mods
    mod = Mod.query.get(product_id)
    if mod:
        return _convert_mod_to_product(mod)
    
    # Try to find in tracks
    track = Track.query.get(product_id)
    if track:
        return _convert_track_to_product(track)
    
    return None
