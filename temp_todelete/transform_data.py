import json
import os

def transform_track_data(track):
    """Transform track data to match database model format"""
    # Get primary download URL from first download
    url = track['downloads'][0]['url'] if track['downloads'] else None
    if not url:
        raise ValueError(f"No download URL found for track: {track['name']}")
    
    # Transform downloads into expected format
    downloads_by_type = {}
    downloads_by_host = {}
    
    for download in track['downloads']:
        dl_type = download['type'].lower()
        dl_url = download['url']
        
        # Add to by_type
        if dl_type not in downloads_by_type:
            downloads_by_type[dl_type] = []
        downloads_by_type[dl_type].append(dl_url)
        
        # Add to by_host
        host = 'mediafire' if 'mediafire' in dl_url else \
               'gdrive' if 'drive.google' in dl_url else \
               'mega' if 'mega.nz' in dl_url else \
               'onedrive' if '1drv.ms' in dl_url else 'other'
        
        downloads_by_host[host] = downloads_by_host.get(host, 0) + 1

    return {
        'url': url,  # Use first download URL as primary URL
        'title': track['name'],
        'creator': track['creator'],
        'description': f"Category: {track.get('category', 'Unknown')}\nCreator: {track['creator']}", 
        'downloads': {
            'by_type': downloads_by_type,
            'by_host': downloads_by_host,
            'download_count': 0
        },
        'images': {
            'cover': track.get('thumbnail'),
            'additional': []
        },
        'embedded_videos': []
    }

def transform_mod_data(mod):
    """Transform mod data to match database model format"""
    # The mod data is already in the correct format, just need to ensure all fields exist
    return {
        'url': mod['url'],
        'title': mod['title'],
        'creator': mod['creator'],
        'description': mod.get('description', ''),
        'downloads': mod['downloads'],
        'images': mod['images'],
        'embedded_videos': mod.get('embedded_videos', [])
    }

def transform_data():
    """Transform tracks and mods data to match database model format"""
    # Transform tracks
    print("\nTransforming tracks data...")
    tracks_input = os.path.join('static', 'data', 'tracks.json')
    tracks_output = os.path.join('static', 'data', 'tracks_transformed.json')
    
    if os.path.exists(tracks_input):
        with open(tracks_input, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        tracks = data['tracks'] if isinstance(data, dict) else data
        transformed_tracks = []
        
        for track in tracks:
            try:
                transformed_track = transform_track_data(track)
                transformed_tracks.append(transformed_track)
            except Exception as e:
                print(f"Error transforming track {track.get('name', 'unknown')}: {str(e)}")
                continue
        
        with open(tracks_output, 'w', encoding='utf-8') as f:
            json.dump(transformed_tracks, f, indent=2, ensure_ascii=False)
        
        print(f"Transformed {len(transformed_tracks)} tracks")
        print(f"Saved to {tracks_output}")
    
    # Transform mods
    print("\nTransforming mods data...")
    mods_input = os.path.join('static', 'data', 'mods_min.json')
    mods_output = os.path.join('static', 'data', 'mods_transformed.json')
    
    if os.path.exists(mods_input):
        with open(mods_input, 'r', encoding='utf-8') as f:
            mods_data = json.load(f)
        
        transformed_mods = []
        for mod_url, mod in mods_data.items():
            try:
                transformed_mod = transform_mod_data(mod)
                transformed_mods.append(transformed_mod)
            except Exception as e:
                print(f"Error transforming mod {mod.get('title', 'unknown')}: {str(e)}")
                continue
        
        with open(mods_output, 'w', encoding='utf-8') as f:
            json.dump(transformed_mods, f, indent=2, ensure_ascii=False)
        
        print(f"Transformed {len(transformed_mods)} mods")
        print(f"Saved to {mods_output}")

if __name__ == '__main__':
    transform_data()
