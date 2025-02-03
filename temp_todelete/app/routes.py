from flask import render_template, Blueprint, jsonify
from app.utils.json_parser import update_tracks_json
import os

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/tracks')
def tracks():
    # Update tracks.json if it doesn't exist or is older than mods.json
    tracks_path = os.path.join('static', 'data', 'tracks.json')
    mods_path = os.path.join('data', 'mods.json')
    
    if (not os.path.exists(tracks_path) or 
        (os.path.exists(mods_path) and 
         os.path.getmtime(mods_path) > os.path.getmtime(tracks_path))):
        update_tracks_json()
        
    return render_template('tracks.html')

@main.route('/bikes')
def bikes():
    return render_template('bikes.html')

@main.route('/championship')
def championship():
    return render_template('championship.html')

@main.route('/ranked')
def ranked():
    return render_template('ranked.html')

@main.route('/rider')
def rider():
    return render_template('rider.html')

@main.route('/downloads')
def downloads():
    return render_template('downloads.html')
