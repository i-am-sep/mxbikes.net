import json
import os

def convert_mods_json(input_file: str, output_file: str) -> bool:
    """Converts mods.json from object to array format."""
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            mods_object = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading JSON file '{input_file}': {e}")
        return False

    #Convert to a list of dictionaries
    mods_array = [mods_object]


    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(mods_array, f, indent=4, ensure_ascii=False)
        print(f"mods.json successfully converted to array format and saved to '{output_file}'.")
        return True
    except IOError as e:
        print(f"Error saving JSON file '{output_file}': {e}")
        return False


if __name__ == "__main__":
    input_file = "data/mods.json"
    output_file = "data/mods_array.json"  # Save to a new file first
    if convert_mods_json(input_file, output_file):
        print("Conversion successful. Now run the update scripts.")
        # Optionally rename the file after testing the merge_track_data script
        # os.rename("data/mods_array.json", "data/mods.json")
    else:
        print("Conversion failed.")