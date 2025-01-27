from flask import jsonify, request
from . import api_blueprint
from ..services.product_service import get_all_products, get_product_by_id

@api_blueprint.route('/products', methods=['GET'])
def get_products():
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Get all products through the service
    products = get_all_products()
    
    # Manual pagination since we're getting all products
    start = (page - 1) * per_page
    end = start + per_page
    paginated_products = products[start:end]
    
    return jsonify(paginated_products)

@api_blueprint.route('/tracks', methods=['GET'])
def get_tracks():
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Get all products and filter tracks
    all_products = get_all_products()
    tracks = [p for p in all_products if p.get('type') == 'track']
    
    # Manual pagination
    start = (page - 1) * per_page
    end = start + per_page
    paginated_tracks = tracks[start:end]
    
    return jsonify({
        'items': paginated_tracks,
        'total': len(tracks),
        'page': page,
        'pages': (len(tracks) + per_page - 1) // per_page,
        'per_page': per_page
    })
