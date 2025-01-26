import json

# Path to your JSON file
json_file_path = "data/mods.json"
output_file_path = "image_links.txt"

def extract_image_links(file_path, output_path):
    try:
        # Load the JSON file
        with open(file_path, "r", encoding="utf-8") as file:
            mods_data = json.load(file)

        # Open the output file for writing
        with open(output_path, "w", encoding="utf-8") as output_file:
            for mod_url, mod_info in mods_data.items():
                images = mod_info.get("images", {})
                
                # Extract cover image
                cover_image = images.get("cover")
                if cover_image:
                    output_file.write(f"{cover_image}\n")
                
                # Extract additional images
                additional_images = images.get("additional", [])
                for image in additional_images:
                    output_file.write(f"{image}\n")

        print(f"Image links have been saved to {output_path}")
    
    except Exception as e:
        print(f"Error: {e}")

# Run the function
extract_image_links(json_file_path, output_file_path)
