import json
import os

def format_downloads(downloads):
    """Format downloads into a simple array of links"""
    if not downloads:
        return {"links": []}
        
    links = []
    
    # Add links from by_type
    for type_links in downloads.get('by_type', {}).values():
        links.extend(type_links)
    
    # Add links from by_host
    for host_links in downloads.get('by_host', {}).values():
        links.extend(host_links)
    
    return {"links": links}

def generate_tracks_json():
    # Read mods.json
    with open('data/mods.json', 'r', encoding='utf-8') as f:
        mods_data = json.load(f)
    
    # Transform data into tracks format
    tracks = []
    for url, mod in mods_data.items():
        track = {
            "title": mod.get('title', ''),
            "creator": mod.get('creator', ''),
            "description": mod.get('description', ''),
            "images": mod.get('images', {}),
            "downloads": format_downloads(mod.get('downloads'))
        }
        tracks.append(track)
    
    # Create output data structure
    output = {
        "items": tracks
    }
    
    # Ensure static/data directory exists
    os.makedirs('static/data', exist_ok=True)
    
    # Write to tracks.json
    with open('static/data/tracks.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    generate_tracks_json()
