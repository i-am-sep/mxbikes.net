import requests
from bs4 import BeautifulSoup
import json
import logging
import os
from urllib.parse import urljoin

# --- Configuration ---
BASE_URL = "https://mxb-mods.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}
OUTPUT_FILE = "data/track_details.json"
TRACK_LINKS_FILE = "data/track_links.json"  # Path to your track links JSON file
PREPOPULATED_FILE = "data/track_details_prepopulated.json"

# Set up logging
logging.basicConfig(
    filename="track_scraper.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


def prepopulate_track_details(track_links_file: str, existing_track_details_file: str, output_file: str) -> None:
    """Creates a pre-populated track_details.json file."""

    def load_json_safe(filepath: str) -> dict:
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    track_links = load_json_safe(track_links_file)
    existing_track_details = load_json_safe(existing_track_details_file)

    new_track_details = {}
    for link in track_links:
        if link in existing_track_details:
            new_track_details[link] = existing_track_details[link]
        else:
            new_track_details[link] = {
                "url": link,
                "title": "N/A",
                "creator": "N/A",
                "downloads": {"by_type": {"other": []}, "by_host": {}, "download_count": 0},
                "images": {"cover": "", "additional": []},
                "description": "N/A",
                "embedded_videos": []
            }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(new_track_details, f, indent=4, ensure_ascii=False)
    print(f"Pre-populated track details saved to {output_file}")
    
def fetch_page_content(url: str) -> str:
    """Fetches the HTML content of a URL, handling potential errors."""
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.content.decode("utf-8")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching URL '{url}': {e}")
        return ""  # Return empty string on error

def extract_track_data(html_content: str) -> dict:
    """Extracts track details from HTML content."""
    soup = BeautifulSoup(html_content, "html.parser")
    data = {
        "downloads": {"by_type": {"other": []}, "by_host": {}},
        "images": {"cover": "", "additional": []},
        "embedded_videos": []
    }

    # Extract title
    title_element = soup.find("h1", class_="single-post-title")
    data["title"] = title_element.text.strip() if title_element else "N/A"

    # Extract creator
    creator_element = soup.find("a", class_="post-author")
    data["creator"] = creator_element.text.strip() if creator_element else "N/A"

    # Extract description
    description_element = soup.find("div", class_="single-post-block")
    data["description"] = description_element.text.strip() if description_element else "N/A"


    # Extract download links (Mediafire, MEGA, etc.)
    download_links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if "mediafire" in href or "mega" in href or "drive.google" in href:
          download_links.append(href)
    if download_links:
      data["downloads"]["by_host"] = {"other": download_links}


    #Extract images
    img_tags = soup.find_all('img')
    if img_tags:
      data['images']['cover'] = img_tags[0].get('src','').strip() #assuming the first image is the cover
      additional_images = [img.get('src','').strip() for img in img_tags[1:]] #get remaining images
      if additional_images:
        data['images']['additional'] = additional_images


    #Extract embedded videos from iframes
    iframe_tags = soup.find_all('iframe')
    if iframe_tags:
      video_urls = [iframe.get('src','').strip() for iframe in iframe_tags if 'youtube' in iframe['src']]
      if video_urls:
        data['embedded_videos'] = video_urls

    return data

def load_json(filepath: str) -> dict:
    """Loads JSON data from a file, handling potential errors."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error(f"Error loading JSON file '{filepath}': {e}")
        return {}

def update_track_details(track_links: list, existing_track_details: dict) -> dict:
    """Updates track details from existing data."""
    updated_tracks = existing_track_details.copy()

    for url in track_links:
        if url not in updated_tracks:
            logging.info(f"Scraping: {url}")
            html_content = fetch_page_content(url)
            track_data = extract_track_data(html_content)
            if track_data:
                updated_tracks[url] = track_data
                updated_tracks[url]["url"] = url #Ensure URL is always present
            else:
                logging.warning(f"Could not extract data for {url}")
                
        else:
          logging.info(f"Track {url} already exists in the dataset, skipping")

    return updated_tracks



if __name__ == "__main__":
    track_links = load_json(TRACK_LINKS_FILE)
    existing_data = load_json(PREPOPULATED_FILE)
    updated_data = update_track_details(track_links, existing_data)

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
            json.dump(updated_data, outfile, indent=4, ensure_ascii=False)
        print(f"Track details successfully written to {OUTPUT_FILE}")
    except IOError as e:
        print(f"Error writing track_details.json: {e}")