from flask import jsonify, request
from . import api_blueprint
from ..services.product_service import get_all_products, get_product_by_id

@api_blueprint.route('/products', methods=['GET'])
def get_products():
    # Get all products through the service
    products = get_all_products()
    
    # Format products for frontend
    formatted_products = []
    for product in products:
        # Extract download links
        downloads = []
        if product.get('downloads'):
            for link in product['downloads'].get('links', []):
                downloads.append({
                    'url': link,
                    'type': 'Download'  # Default type since we don't have specific types
                })
        
        formatted_product = {
            'name': product['title'],
            'creator': product['creator'],
            'category': product['type'].capitalize(),  # 'track' -> 'Track', 'mod' -> 'Mod'
            'thumbnail': product['images'].get('cover') if product.get('images') else None,
            'downloads': downloads
        }
        formatted_products.append(formatted_product)
    
    return jsonify(formatted_products)

@api_blueprint.route('/tracks', methods=['GET'])
def get_tracks():
    # Get all products and filter tracks
    all_products = get_all_products()
    tracks = [p for p in all_products if p.get('type') == 'track']
    
    return jsonify({
        'items': tracks,
        'total': len(tracks)
    })
