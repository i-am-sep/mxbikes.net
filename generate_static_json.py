from app import create_app
from app.models.product import Product
import json
import os

def generate_static_json():
    app = create_app('production')
    
    with app.app_context():
        # Generate mods JSON
        mods = Product.query.filter_by(product_type='mod').all()
        mods_data = {
            'items': [mod.to_dict() for mod in mods],
            'total': len(mods),
            'pages': 1,
            'current_page': 1
        }
        
        # Generate tracks JSON
        tracks = Product.query.filter_by(product_type='track').all()
        tracks_data = {
            'items': [track.to_dict() for track in tracks],
            'total': len(tracks),
            'pages': 1,
            'current_page': 1
        }
        
        # Ensure static/data directory exists
        os.makedirs('static/data', exist_ok=True)
        
        # Write JSON files
        with open('static/data/mods.json', 'w', encoding='utf-8') as f:
            json.dump(mods_data, f, ensure_ascii=False, indent=2)
            
        with open('static/data/tracks.json', 'w', encoding='utf-8') as f:
            json.dump(tracks_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    generate_static_json()
