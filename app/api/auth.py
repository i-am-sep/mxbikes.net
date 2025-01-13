from flask import jsonify, request
from ..services.auth_service import authenticate_user
from . import api_blueprint

@api_blueprint.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    token = authenticate_user(data.get('username'), data.get('password'))
    if token:
        return jsonify({'token': token})
    else:
        return jsonify({'message': 'Invalid credentials'}), 401