import json

def extract_track_details(mods_filepath, output_filepath):
    """Extracts track details and handles missing keys gracefully."""
    try:
        with open(mods_filepath, 'r', encoding='utf-8') as f:
            mods_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading mods.json: {e}")
        return

    track_details = []
    for mod_url, mod_data in mods_data.items():
        try:
            downloads_count = mod_data["downloads"]["download_count"]
            mediafire_link = mod_data["downloads"]["by_host"].get("mediafire",[None])[0]
        except (KeyError, TypeError) as e:  # Catch KeyError and TypeError for missing keys or NoneType
            print(f"Warning: Skipping entry '{mod_url}' due to missing key or NoneType: {e}")
            downloads_count = 0 #Set to 0 if missing instead of erroring
            mediafire_link = None

        track_details.append({
            "url": mod_data.get("url", "N/A"), #Handles missing url
            "title": mod_data.get("title", "N/A"), #Handles missing title
            "creator": mod_data.get("creator", "N/A"), #Handles missing creator
            "cover_image": mod_data["images"].get("cover", "N/A"), #Handles missing cover image
            "downloads": downloads_count,
            "mediafire_download": mediafire_link
        })

    try:
        with open(output_filepath, 'w', encoding='utf-8') as outfile:
            json.dump(track_details, outfile, indent=4)
        print(f"Track details successfully written to {output_filepath}")
    except IOError as e:
        print(f"Error writing track_details.json: {e}")

if __name__ == "__main__":
    input_file = 'data/mods.json'
    output_file = 'data/track_details.json'
    extract_track_details(input_file, output_file)