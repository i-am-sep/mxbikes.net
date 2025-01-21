from flask import Blueprint

api_blueprint = Blueprint('api', __name__)

from . import routes  # Import the routes for this blueprint