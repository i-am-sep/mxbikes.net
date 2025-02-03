from flask import jsonify, request
from ..services.payment_service import process_payment
from . import api_blueprint

@api_blueprint.route('/auth/purchase', methods=['POST'])
def purchase():
    data = request.json
    success = process_payment(data)
    if success:
        return jsonify({'message': 'Purchase successful'}), 200
    else:
        return jsonify({'message': 'Payment failed'}), 400