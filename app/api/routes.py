from flask import jsonify, request
from . import api_blueprint
from ..models.product import Product

@api_blueprint.route('/tracks', methods=['GET'])
def get_tracks():
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Query tracks from database
    tracks = Product.query.filter_by(product_type='track').paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Convert to dictionary format expected by frontend
    items = [track.to_dict() for track in tracks.items]
    
    return jsonify({
        'items': items,
        'total': tracks.total,
        'page': tracks.page,
        'pages': tracks.pages,
        'per_page': per_page
    })
