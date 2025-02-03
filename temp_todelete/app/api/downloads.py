from flask import jsonify, send_from_directory, current_app
from ..services.download_service import authorize_download, get_download_path
from . import api_blueprint
import os

@api_blueprint.route('/free_download/<int:product_id>')
def free_download(product_id):
    download_path = get_download_path(product_id, paid=False)
    if download_path:
        try:
            # Use current_app.root_path to get the root directory of the Flask app
            return send_from_directory(directory=os.path.join(current_app.root_path, os.path.dirname(download_path)), 
                                       path=os.path.basename(download_path), as_attachment=True)
        except FileNotFoundError:
            return jsonify({'message': 'File not found'}), 404
    else:
        return jsonify({'message': 'Download not authorized'}), 403

@api_blueprint.route('/password/<int:product_id>')
def get_password(product_id):
    # Logic to check if the user is authorized and the time is right
    authorized, password = authorize_download(product_id)
    if authorized:
        return jsonify({'password': password})
    else:
        return jsonify({'message': 'Not authorized or invalid product'}), 403