from flask import Blueprint, jsonify  # Import jsonify if you're returning JSON

from app.api import api_blueprint

@api_blueprint.route('/api/example', methods=['GET'])
def example():
    return jsonify({'message': 'Hello from the API!'})