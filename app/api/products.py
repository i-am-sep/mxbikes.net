from flask import Blueprint, jsonify
from app.services.data_service import DataService

bp = Blueprint('products', __name__)
data_service = DataService()

@bp.route('/api/products')
def get_products():
    """Get all products (tracks and mods)"""
    tracks = data_service.get_tracks()
    mods = data_service.get_mods()
    
    # Convert dictionary to list and add type and name fields
    products = []
    
    for track in tracks.values():
        track_data = {
            'name': track['title'],
            'creator': track['creator'],
            'category': 'Track',
            'thumbnail': track['images'].get('cover') if track['images'] else None,
            'downloads': [
                {'url': dl['url'], 'type': dl['type']} 
                for dl in track['downloads'].get('by_type', {}).get('other', [])
            ] if track['downloads'] else []
        }
        products.append(track_data)
        
    for mod in mods.values():
        mod_data = {
            'name': mod['title'],
            'creator': mod['creator'],
            'category': 'Mod',
            'thumbnail': mod['images'].get('cover') if mod['images'] else None,
            'downloads': [
                {'url': dl['url'], 'type': dl['type']}
                for dl in mod['downloads'].get('by_type', {}).get('other', [])
            ] if mod['downloads'] else []
        }
        products.append(mod_data)
    
    return jsonify(products)
