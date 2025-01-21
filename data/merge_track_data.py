import json
import os
from typing import List, Dict, Any

def merge_track_data(mods_file: str, track_details_file: str, output_file: str) -> bool:
    """Merges track details into the main mods JSON file, handling potential errors gracefully."""

    def load_json(filepath: str) -> List[Dict[str, Any]]:
        """Loads JSON data from a file, returning an empty list if errors occur."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading JSON file '{filepath}': {e}")
            return []  # Return empty list instead of None for easier handling

    mods: List[Dict[str, Any]] = load_json(mods_file)
    track_details: Dict[str, Dict[str, Any]] = load_json(track_details_file)

    if not mods or not track_details:  #check if either file loaded correctly
        return False

    # Use a dictionary for faster lookups by URL
    mods_by_url = {mod.get("url", ""): mod for mod in mods}


    for url, track_data in track_details.items():
        if url in mods_by_url:
            # Update existing
            match = mods_by_url[url]
            match["name"] = track_data.get("title", "N/A")
            match["description"] = track_data.get("description", "N/A")
            match["downloads"] = [{"url": link, "label": "Download"} for link in track_data.get("download_links", [])]
            match["type"] = "track"
            match["images"] = track_data.get("images", [])
        else:
            # Add new
            new_track = {
                "name": track_data.get("title", "N/A"),
                "description": track_data.get("description", "N/A"),
                "category": None,
                "type": "track",
                "downloads": [{"url": link, "label": "Download"} for link in track_data.get("download_links", [])],
                "images": track_data.get("images", []),
                "url": url
            }
            mods.append(new_track)

    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(mods, f, indent=4)
        return True
    except IOError as e:
        print(f"Error saving JSON file '{output_file}': {e}")
        return False


if __name__ == "__main__":
    mods_file = "data/mods_array.json"  # Use the converted file
    track_details_file = "data/track_details.json"
    output_file = "data/updated_mods.json"


    if merge_track_data(mods_file, track_details_file, output_file):
        print("Merging successful! Rename 'data/updated_mods.json' to 'data/mods.json'")
        # Uncomment the following line to automatically rename the file.  Use caution in production!
        # os.rename("data/updated_mods.json", "data/mods.json")
    else:
        print("Merging failed. Check the logs for errors.")