import json
import os
from typing import Dict, List, Generator
import ijson  # We'll need to add this to requirements.txt

def extract_tracks_from_mods(mods_path: str, output_path: str) -> bool:
    """
    Safely extracts track data from mods.json and saves to tracks.json
    Uses streaming parser to avoid loading entire file into memory
    """
    try:
        tracks = []
        
        # Stream parse the mods.json file
        with open(mods_path, 'rb') as file:
            parser = ijson.parse(file)
            current_item = {}
            in_item = False
            
            for prefix, event, value in parser:
                # Start of a new item
                if prefix.endswith('.type'):
                    in_item = (value == 'track')
                    if in_item:
                        current_item = {'type': 'track'}
                
                # Collect relevant fields for tracks
                elif in_item:
                    if prefix.endswith('.title'):
                        current_item['title'] = value
                    elif prefix.endswith('.creator'):
                        current_item['creator'] = value
                    elif prefix.endswith('.description'):
                        current_item['description'] = value
                    elif prefix.endswith('.category'):
                        current_item['category'] = value
                    elif prefix.endswith('.images.cover'):
                        current_item.setdefault('images', {})['cover'] = value
                    elif prefix.endswith('.downloads.links'):
                        current_item.setdefault('downloads', {})['links'] = value
                    
                    # End of current item
                    if event == 'end_map':
                        if current_item.get('type') == 'track':
                            tracks.append(current_item)
                        current_item = {}
                        in_item = False

        # Save extracted tracks to tracks.json
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'items': tracks,
                'total': len(tracks),
                'type': 'tracks'
            }, f, indent=2)
            
        return True
        
    except Exception as e:
        print(f"Error extracting tracks: {str(e)}")
        return False

def update_tracks_json():
    """
    Updates tracks.json with latest track data from mods.json
    """
    mods_path = os.path.join('data', 'mods.json')
    tracks_path = os.path.join('static', 'data', 'tracks.json')
    
    if not os.path.exists(mods_path):
        print("mods.json not found")
        return False
        
    return extract_tracks_from_mods(mods_path, tracks_path)
