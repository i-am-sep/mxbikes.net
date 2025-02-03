import json
import os
from typing import Dict, List, Generator
import ijson  # We'll need to add this to requirements.txt

def stream_json_objects(file_path: str, batch_size: int = 10) -> Generator[List[Dict], None, None]:
    """
    Stream JSON objects from a file in batches to avoid loading entire file into memory
    """
    try:
        batch = []
        with open(file_path, 'rb') as file:
            # Parse the entire JSON object
            parser = ijson.parse(file)
            current_object = {}
            current_key = None
            
            for prefix, event, value in parser:
                if event == 'map_key':
                    # Start of a new object
                    if '.' not in prefix:  # Top-level key
                        if current_object:  # If we have a previous object, add it to batch
                            current_object['url'] = current_key
                            batch.append(current_object)
                            if len(batch) >= batch_size:
                                yield batch
                                batch = []
                        current_key = value
                        current_object = {}
                elif current_object is not None:
                    # Map the JSON structure to match what we need
                    if prefix.endswith('.title'):
                        current_object['title'] = value
                    elif prefix.endswith('.creator'):
                        current_object['creator'] = value
                    elif prefix.endswith('.description'):
                        current_object['description'] = value
                    elif prefix.endswith('.images'):
                        current_object['images'] = value
                    elif prefix.endswith('.downloads'):
                        # Transform downloads structure to match expected format
                        if isinstance(value, dict):
                            links = []
                            if 'by_type' in value:
                                for type_links in value['by_type'].values():
                                    if isinstance(type_links, list):
                                        links.extend(type_links)
                            current_object['downloads'] = {'links': links}
            
            # Don't forget the last object
            if current_object:
                current_object['url'] = current_key
                batch.append(current_object)
            if batch:
                yield batch
                
    except Exception as e:
        print(f"Error streaming JSON objects: {str(e)}")
        yield []

def process_tracks_batch(batch: List[Dict]) -> List[Dict]:
    """
    Process and validate a batch of track data
    """
    processed_tracks = []
    for track in batch:
        try:
            # Ensure required fields exist
            processed_track = {
                'title': track.get('title', 'Untitled Track'),
                'creator': track.get('creator', 'Unknown'),
                'description': track.get('description', 'No description available'),
                'product_type': 'track',
                'category': track.get('category', 'track'),
                'images': track.get('images', {}),
                'downloads': track.get('downloads', {'links': []})
            }
            processed_tracks.append(processed_track)
        except Exception as e:
            print(f"Error processing track: {str(e)}")
            continue
    return processed_tracks

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
