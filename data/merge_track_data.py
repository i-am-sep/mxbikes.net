import json
import os

def merge_track_data(mods_file, track_details_file, output_file):
    """Merges track details into the main mods JSON file."""
    try:
        with open(mods_file, "r", encoding="utf-8") as f:  # added encoding
            mods = json.load(f)
        with open(track_details_file, "r", encoding="utf-8") as f:  # added encoding
            track_details = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading JSON files: {e}")
        return False  # Indicate failure

    for url, track_data in track_details.items():
        #Check for existing match before creating new entry.
        match = next((mod for mod in mods if mod.get("url") == url), None)

        if match:
            # Update existing
            match["name"] = track_data.get("title", "N/A")
            match["description"] = track_data.get("description", "N/A")
            match["downloads"] = [{"url": link, "label": "Download"} for link in track_data.get("download_links", [])]
            match["type"] = "track"
            #Handle images -  add more robust image handling if you have URLs
            match["images"] = track_data.get("images", []) 
        else:
            # Add new
            new_track = {
                "name": track_data.get("title", "N/A"),
                "description": track_data.get("description", "N/A"),
                "category": None,
                "type": "track",
                "downloads": [{"url": link, "label": "Download"} for link in track_data.get("download_links", [])],
                "images": track_data.get("images", []),  # Include images if available
                "url": url
            }
            mods.append(new_track)

    try:
        with open(output_file, "w", encoding="utf-8") as f:  # added encoding
            json.dump(mods, f, indent=4)
        return True # Indicate success
    except IOError as e:
        print(f"Error saving JSON file: {e}")
        return False # Indicate failure


if __name__ == "__main__":
    mods_file = "mods.json"
    track_details_file = "track_details.json"
    output_file = "updated_mods.json"  # Save to a new file first

    if merge_track_data(mods_file, track_details_file, output_file):
        print("Merging successful!  Rename 'updated_mods.json' to 'mods.json'")
        # Optionally rename the file here if everything went well.
        # os.rename("updated_mods.json", "mods.json") 
    else:
        print("Merging failed. Check the logs for errors.")

