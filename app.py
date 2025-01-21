from flask import Flask, render_template, send_from_directory, url_for, request, jsonify # ... other imports
import os
import json
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

from app.extensions import db #Import db from extensions
from app.services.auth_service import add_guid
from app.models.guid import GUID
from config import Config

DISCORD_PUBLIC_KEY = "ae8c6b84a1f9841c08f47e53476b2a1d3ee9822512a77acbb8438ef0abd2940b"

def create_app(template_folder=None, instance_path=None):
    app = Flask(__name__, 
                instance_relative_config=True,
                static_folder='static',
                static_url_path='/static')  # Changed to explicit static URL path
    if instance_path:
        app.instance_path = instance_path
    if template_folder:
        app.template_folder = template_folder

    # Load config from Config class
    app.config.from_object(Config)
    print("Configuration loaded successfully.")

    # Check for required config values
    required_configs = ['SQLALCHEMY_DATABASE_URI', 'SECRET_KEY']
    missing_configs = [config for config in required_configs if config not in app.config]
    if missing_configs:
        print(f"Error: Missing configuration values: {missing_configs}")
        return None

    print(f"Instance Path: {app.instance_path}")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"Template Folder: {app.template_folder}")

    try:
        db.init_app(app)
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        return None

    try:
        from app.api import api_blueprint
        app.register_blueprint(api_blueprint)
        print("Blueprint registered successfully.")
    except Exception as e:
        print(f"Error registering blueprint: {e}")
        return None

    return app

def verify_signature(request):
    signature = request.headers.get("X-Signature-Ed25519")
    timestamp = request.headers.get("X-Signature-Timestamp")
    body = request.get_data(as_text=True)

    if signature is None or timestamp is None:
        return False

    try:
        verify_key = VerifyKey(bytes.fromhex(DISCORD_PUBLIC_KEY))
        verify_key.verify(f"{timestamp}{body}".encode(), bytes.fromhex(signature))
        return True
    except BadSignatureError:
        return False

app = create_app(
    template_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates')),
    instance_path='./instance'
)

@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        print(f"Error rendering index template: {e}")
        return f"Error rendering index template: {e}", 500

@app.route('/bikes')
def bikes():
    try:
        return render_template('bikes.html')
    except Exception as e:
        print(f"Error rendering bikes template: {e}")
        return f"Error rendering bikes template: {e}", 500

@app.route('/tracks')
def tracks():
    try:
        return render_template('tracks.html')
    except Exception as e:
        print(f"Error rendering tracks template: {e}")
        return f"Error rendering tracks template: {e}", 500

@app.route('/rider')
def rider():
    try:
        return render_template('rider.html')
    except Exception as e:
        print(f"Error rendering rider template: {e}")
        return f"Error rendering rider template: {e}", 500

@app.route('/championship')
def championship():
    try:
        return render_template('championship.html')
    except Exception as e:
        print(f"Error rendering championship template: {e}")
        return f"Error rendering championship template: {e}", 500

@app.route('/ranked')
def ranked():
    try:
        return render_template('ranked.html')
    except Exception as e:
        print(f"Error rendering ranked template: {e}")
        return f"Error rendering ranked template: {e}", 500

@app.route('/downloads')
def downloads():
    try:
        with open('data/mods.json', 'r', encoding='utf-8') as f:
            mods_data = json.load(f)
        return render_template('downloads.html', mods=mods_data)
    except FileNotFoundError:
        return "Error: mods.json not found. Please check the file location.", 500
    except json.JSONDecodeError as e:
        return f"Error: Invalid JSON data in mods.json: {e}. Please check the file's contents.", 500
    except Exception as e:
        return f"An unexpected error occurred in the downloads route: {e}", 500

# Add route to serve data/mods.json
@app.route('/data/mods.json')
def serve_mods():
    try:
        with open('data/mods.json', 'r', encoding='utf-8') as f:
            mods_data = json.load(f)
        return jsonify(mods_data)
    except FileNotFoundError:
        return jsonify({"error": "mods.json not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON data"}), 500

# Add route to serve track_details.json
@app.route('/data/tracks.json')
def serve_tracks():
    try:
        with open('data/track_details.json', 'r', encoding='utf-8') as f:
            tracks_data = json.load(f)
        return jsonify(tracks_data)
    except FileNotFoundError:
        return jsonify({"error": "track_details.json not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON data"}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=8001)