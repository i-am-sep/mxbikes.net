import requests
from bs4 import BeautifulSoup
import json
import logging
import time
import os
from xml.etree import ElementTree

# --- Configuration ---
BASE_URL = "https://mxb-mods.com"  # Base URL for your site
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"  # Location of sitemap
OUTPUT_FILE = "track_details.json"  # Where to save data
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}
# Set up logging
logging.basicConfig(
    filename="track_scraper.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def fetch_sitemap_links(sitemap_url):
     """Fetch all URLs from a sitemap XML."""
     try:
        response = requests.get(sitemap_url, headers=HEADERS)
        response.raise_for_status()
     except requests.RequestException as e:
         logging.error(f"Failed to fetch sitemap: {e}")
         return []

     try:
        xml_content = response.content
        root = ElementTree.fromstring(xml_content)
        
        # Namespace might be needed for some sitemaps
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        urls = [element.text for element in root.findall('.//ns:loc', namespace)]
        return urls
     except ElementTree.ParseError as e:
        logging.error(f"Failed to parse sitemap XML: {e}")
        return []

def load_existing_data(filename):
    """Load existing data from a JSON file."""
    if not os.path.exists(filename):
        return {}  # Return an empty dictionary for easier access
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def scrape_track_details(url):
    """Scrape detailed data from a single track page."""
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        logging.error(f"Failed to fetch {url} (Error: {e})")
        return None

    soup = BeautifulSoup(response.content, "html.parser")
    data = {"url": url}

    # Extract title
    title_tag = soup.find("h2", class_="archive-post-title")
    data["title"] = title_tag.text.strip() if title_tag else "N/A"

    # Extract creator name
    creator_tag = soup.find("span", class_="post-author")
    data["creator"] = creator_tag.text.strip() if creator_tag else "N/A"

    # Extract download links
    download_links = []
    for link in soup.find_all("a", href=True):
        if "download" in link["href"] or "mediafire" in link["href"] or "mega" in link["href"]:
            download_links.append(link["href"])
    data["download_links"] = download_links if download_links else ["N/A"]

    # Extract description
    description_tag = soup.find("div", class_="post-content")
    data["description"] = description_tag.text.strip() if description_tag else "N/A"

    return data

def update_track_details():
    """Main function to update track details."""
    
    sitemap_links = fetch_sitemap_links(SITEMAP_URL)
    if not sitemap_links:
        logging.warning("No links found in sitemap, skipping update.")
        return

    #Filter for track links only
    track_links = [url for url in sitemap_links if "/tracks/" in url]

    if not track_links:
        logging.info("No track links found, skipping update.")
        return
    
    existing_tracks = load_existing_data(OUTPUT_FILE)

    updated_tracks = {}

    for url in track_links:
        logging.info(f"Scraping: {url}")
        track_data = scrape_track_details(url)
        if track_data:
            updated_tracks[url] = track_data


    #merge existing data
    if existing_tracks:
        for url, new_data in updated_tracks.items():
            if url in existing_tracks:
                if new_data != existing_tracks[url]:
                    logging.info(f"Updating track: {url}")
                    existing_tracks[url] = new_data  # Update existing entry
                else:
                    logging.info(f"No changes to {url}, skipping")
            else:
                logging.info(f"Adding new track: {url}")
                existing_tracks[url] = new_data  # Add new entry
    else:
        logging.info("New data only, saving for first time")
        existing_tracks = updated_tracks

    # Save to JSON
    with open(OUTPUT_FILE, "w") as f:
        json.dump(existing_tracks, f, indent=4)

    logging.info(f"Track details updated and saved to {OUTPUT_FILE}.")

if __name__ == "__main__":
    update_track_details()
