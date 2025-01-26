from flask import jsonify, request
from app.api import api_blueprint
from app.models.product import Product
from app.extensions import db

@api_blueprint.route('/mods', methods=['GET'])
def get_mods_list():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit per_page to prevent excessive loads
    per_page = min(per_page, 50)
    
    pagination = Product.query.filter_by(product_type='mod').paginate(
        page=page, 
        per_page=per_page,
        error_out=False
    )
    
    return jsonify({
        'items': [mod.to_dict() for mod in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@api_blueprint.route('/tracks', methods=['GET'])
def get_tracks_list():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit per_page to prevent excessive loads
    per_page = min(per_page, 50)
    
    pagination = Product.query.filter_by(product_type='track').paginate(
        page=page, 
        per_page=per_page,
        error_out=False
    )
    
    return jsonify({
        'items': [track.to_dict() for track in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })
