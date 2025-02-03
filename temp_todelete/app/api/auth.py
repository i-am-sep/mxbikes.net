from flask import jsonify, request
from ..services.auth_service import authenticate_user, add_guid
from . import api_blueprint

@api_blueprint.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    token = authenticate_user(data.get('username'), data.get('password'))
    if token:
        return jsonify({'token': token})
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

@api_blueprint.route('/auth/guid', methods=['POST'])
def add_guid_api():
    data = request.json
    guid = add_guid(data.get('discord_user_id'), data.get('guid'))
    if guid:
       return jsonify({'message': 'Guid added', 'guid_id': guid.id}), 201
    else:
      return jsonify({'message': 'Could not add guid'}), 400