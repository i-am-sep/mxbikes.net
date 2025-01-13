from flask import jsonify, request
from ..services.product_service import get_all_products, get_product_by_id
from . import api_blueprint

@api_blueprint.route('/products', methods=['GET'])
def list_products():
    products = get_all_products()
    return jsonify(products)

@api_blueprint.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = get_product_by_id(product_id)
    if product:
        return jsonify(product)
    else:
        return jsonify({'message': 'Product not found'}), 404