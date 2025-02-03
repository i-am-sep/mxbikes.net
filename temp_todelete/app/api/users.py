from flask import jsonify, request
from ..services.auth_service import create_user
from . import api_blueprint

@api_blueprint.route('/users', methods=['POST'])
def register_user():
    data = request.json
    user = create_user(data)
    if user:
        return jsonify({'message': 'User created', 'user_id': user.id}), 201
    else:
        return jsonify({'message': 'Could not create user'}), 400