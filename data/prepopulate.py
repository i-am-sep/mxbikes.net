import json

def prepopulate_track_details(track_links_file, existing_track_details_file, output_file):
    """Creates a pre-populated track_details.json file."""

    try:
        with open(track_links_file, "r") as f:
            track_links = json.load(f)
    except FileNotFoundError:
        print(f"Error: {track_links_file} not found.")
        return

    try:
        with open(existing_track_details_file, "r") as f:
            existing_track_details = json.load(f)
    except FileNotFoundError:
        existing_track_details = {}  # Start with an empty dictionary if the file doesn't exist


    new_track_details = {}
    for link in track_links:
        if link in existing_track_details:
            new_track_details[link] = existing_track_details[link]  # Use existing data if available
        else:
            #Create placeholder. Update the keys/structure as needed for your format.
            new_track_details[link] = {
                "url": link,
                "title": "N/A",
                "creator": "N/A",
                "downloads": {"by_type": {"other": []}, "by_host": {}},
                "images": {"cover": "", "additional": []},
                "description": "N/A",
                "embedded_videos": [] # Added this from the example you provided.
            }



    with open(output_file, "w", encoding='utf-8') as f:
        json.dump(new_track_details, f, indent=4, ensure_ascii=False)  # Use ensure_ascii=False for special characters

    print(f"Pre-populated track details saved to {output_file}")

if __name__ == "__main__":
    track_links_file = "track_links.json"
    existing_track_details_file = "track_details.json"
    output_file = "track_details_prepopulated.json" # Output to a different file to be safe

    prepopulate_track_details(track_links_file, existing_track_details_file, output_file)