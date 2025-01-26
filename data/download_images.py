import requests
from bs4 import BeautifulSoup
import concurrent.futures
import time
from dataclasses import dataclass
import re
import logging
import os
import urllib.parse
import json
import hashlib
import urllib3

# Disable HTTPS verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set up more detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Log to console
        logging.FileHandler('download.log')  # Also log to file
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Proxy:
    ip_port: str
    proxy_type: str = "HTTP"
    anonymity: str = "Unknown"
    country: str = "Unknown"
    latency: float = float('inf')

    def to_dict(self):
        return {
            'ip_port': self.ip_port,
            'proxy_type': self.proxy_type,
            'anonymity': self.anonymity,
            'country': self.country,
            'latency': self.latency
        }

    @classmethod
    def from_dict(cls, data):
        return cls(**data)

class SpysProxyParser:
    def __init__(self, url="https://spys.me/proxy.txt"):
        self.url = url
        self.proxies = []
        self.session = requests.Session()
        self.session.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
        logger.info(f"Initialized SpysProxyParser with URL: {url}")

    def fetch_proxies(self):
        try:
            logger.info("Attempting to fetch proxies...")
            response = self.session.get(self.url, timeout=10)
            response.raise_for_status()
            text = response.text
            lines = text.strip().split('\n')
            proxies = []

            logger.info(f"Found {len(lines)} lines in proxy list")
            valid_proxy_count = 0

            for line in lines:
                line = line.strip()
                if not line or line.startswith("Proxy list") or not line.replace(" ", ""):
                    continue

                parts = line.split()
                if len(parts) < 3:
                    continue

                try:
                    ip_port = parts[0].strip()
                    ip_port = re.sub(r"[^0-9.:]", "", ip_port)
                    if ":" not in ip_port:
                        continue

                    proxies.append(Proxy(ip_port=ip_port))
                    valid_proxy_count += 1

                except (IndexError, ValueError) as e:
                    logger.warning(f"Skipping invalid proxy line: {line}. Error: {str(e)}")

            logger.info(f"Successfully parsed {valid_proxy_count} valid proxies")
            self.proxies = proxies
            return proxies

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching proxies: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"An unexpected error occurred while fetching proxies: {str(e)}")
            return []

    def test_proxy(self, proxy, timeout=1):  # Changed default timeout to 1s
        logger.debug(f"Testing proxy: {proxy.ip_port}")
        try:
            proxies = {"http": f"http://{proxy.ip_port}", "https": f"http://{proxy.ip_port}"}
            start_time = time.time()
            response = requests.get("http://httpbin.org/ip", proxies=proxies, timeout=timeout, verify=False)
            response.raise_for_status()
            proxy.latency = time.time() - start_time
            logger.debug(f"Proxy {proxy.ip_port} working, latency: {proxy.latency:.2f}s")
            return proxy
        except (requests.exceptions.RequestException, Exception) as e:
            logger.debug(f"Proxy {proxy.ip_port} failed: {str(e)}")
            return None

    def save_working_proxies(self, proxies):
        """Save working proxies to JSON file"""
        try:
            with open("data/working_proxies.json", "w") as f:
                json.dump([p.to_dict() for p in proxies], f)
            logger.info(f"Saved {len(proxies)} working proxies to file")
        except Exception as e:
            logger.error(f"Error saving working proxies: {str(e)}")

    def load_working_proxies(self):
        """Load working proxies from JSON file"""
        try:
            if os.path.exists("data/working_proxies.json"):
                with open("data/working_proxies.json", "r") as f:
                    data = json.load(f)
                proxies = [Proxy.from_dict(p) for p in data]
                logger.info(f"Loaded {len(proxies)} working proxies from file")
                return proxies
            return []
        except Exception as e:
            logger.error(f"Error loading working proxies: {str(e)}")
            return []

    def test_proxies(self, num_to_test=100, num_threads=20, force_new=False):
        """Test proxies with option to use cached results"""
        if not force_new:
            cached_proxies = self.load_working_proxies()
            if cached_proxies:
                logger.info("Using cached working proxies")
                return cached_proxies

        logger.info(f"Testing {num_to_test} proxies with {num_threads} threads")
        working_proxies = []
        proxies_to_test = self.proxies[:num_to_test]

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(self.test_proxy, proxy) for proxy in proxies_to_test]
            for future in concurrent.futures.as_completed(futures):
                proxy = future.result()
                if proxy:
                    working_proxies.append(proxy)
                    logger.info(f"Found working proxy: {proxy.ip_port} (latency: {proxy.latency:.2f}s)")

        logger.info(f"Found {len(working_proxies)} working proxies out of {num_to_test} tested")
        
        # Save the new working proxies
        self.save_working_proxies(working_proxies)
        
        return working_proxies

def create_data_directory():
    """Create the data directory if it doesn't exist"""
    if not os.path.exists("data"):
        logger.info("Creating data directory...")
        try:
            os.makedirs("data")
            logger.info("Data directory created successfully")
        except Exception as e:
            logger.error(f"Failed to create data directory: {str(e)}")
            raise

def read_image_urls():
    """Read image URLs from the file"""
    try:
        logger.info("Reading image URLs from data/image_links.txt")
        with open("data/image_links.txt", "r") as f:
            urls = [line.strip() for line in f if line.strip()]
        logger.info(f"Found {len(urls)} image URLs")
        return urls
    except FileNotFoundError:
        logger.error("image_links.txt not found in data directory")
        raise
    except Exception as e:
        logger.error(f"Error reading image URLs: {str(e)}")
        raise

def load_downloaded_images():
    """Load the list of already downloaded images"""
    try:
        if os.path.exists("data/downloaded_images.json"):
            with open("data/downloaded_images.json", "r") as f:
                return set(json.load(f))
        return set()
    except Exception as e:
        logger.error(f"Error loading downloaded images list: {str(e)}")
        return set()

def save_downloaded_images(downloaded_images):
    """Save the list of downloaded images"""
    try:
        with open("data/downloaded_images.json", "w") as f:
            json.dump(list(downloaded_images), f)
    except Exception as e:
        logger.error(f"Error saving downloaded images list: {str(e)}")

def get_safe_filename(url):
    """Generate a safe filename from URL"""
    try:
        # Get the original filename from URL
        parsed_url = urllib.parse.urlparse(url)
        original_name = os.path.basename(parsed_url.path)
        
        # If no extension in original name, default to .jpg
        if not os.path.splitext(original_name)[1]:
            original_name += '.jpg'
            
        # If filename is too long or contains invalid characters, hash it
        if len(original_name) > 50 or re.search(r'[<>:"/\\|?*]', original_name):
            name, ext = os.path.splitext(original_name)
            hash_name = hashlib.md5(url.encode()).hexdigest()[:10]
            original_name = f"{hash_name}{ext}"
            
        return original_name
    except Exception:
        # Fallback to hash if anything goes wrong
        return hashlib.md5(url.encode()).hexdigest()[:10] + '.jpg'

def download_image(url, proxy, downloaded_images, max_retries=3):
    if url in downloaded_images:
        logger.info(f"Skipping already downloaded image: {url}")
        return True

    logger.info(f"Attempting to download {url} using proxy {proxy.ip_port}")
    
    for attempt in range(max_retries):
        try:
            proxies = {
                "http": f"http://{proxy.ip_port}",
                "https": f"http://{proxy.ip_port}"
            }
            response = requests.get(
                url, 
                proxies=proxies, 
                timeout=15,
                stream=True, 
                verify=False,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            )
            response.raise_for_status()

            # Check if response is actually an image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logger.error(f"Response is not an image (content-type: {content_type})")
                return False

            filename = get_safe_filename(url)
            filepath = os.path.join("data", filename)
            
            logger.info(f"Saving image to {filepath}")
            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            downloaded_images.add(url)
            save_downloaded_images(downloaded_images)
            logger.info(f"Successfully downloaded {url}")
            return True

        except requests.exceptions.RequestException as e:
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed for {url}: {str(e)}")
            if attempt == max_retries - 1:
                logger.error(f"All attempts failed for {url}")
                return False
            time.sleep(1)  # Wait before retry
        except Exception as e:
            logger.error(f"Unexpected error downloading {url}: {str(e)}")
            return False

def get_valid_input(prompt, min_val, max_val):
    while True:
        try:
            value = int(input(prompt))
            if min_val <= value <= max_val:
                return value
            print(f"Please enter a number between {min_val} and {max_val}")
        except ValueError:
            print("Please enter a valid number")

def main():
    try:
        # Create data directory
        create_data_directory()
        
        # Get user input for number of threads - increased max for i9-12900K
        num_threads = get_valid_input("Enter number of threads for proxy testing (1-100): ", 1, 100)
        batch_size = get_valid_input("Enter number of images to download at a time (1-50): ", 1, 50)
        force_new_proxies = input("Force new proxy test? (y/n): ").lower() == 'y'
        
        # Initialize proxy parser
        parser = SpysProxyParser()
        
        # Fetch and test proxies
        logger.info("Starting proxy fetch and test process...")
        proxies = parser.fetch_proxies()
        
        if not proxies:
            logger.error("No proxies found, exiting.")
            return

        # Read image URLs
        try:
            image_urls = read_image_urls()
        except Exception as e:
            logger.error(f"Failed to read image URLs: {str(e)}")
            return

        # Get user input for total images to download
        max_images = min(len(image_urls), get_valid_input(f"Enter number of images to download (1-{len(image_urls)}): ", 1, len(image_urls)))

        # Load already downloaded images
        downloaded_images = load_downloaded_images()
        
        # Test proxies with option to use cached results
        working_proxies = parser.test_proxies(num_to_test=len(proxies), num_threads=num_threads, force_new=force_new_proxies)
        working_proxies = [p for p in working_proxies if p.latency != float('inf')]
        working_proxies.sort(key=lambda x: x.latency)  # Sort by latency

        if not working_proxies:
            logger.error("No working proxies found, exiting.")
            return

        logger.info(f"Starting download of {max_images} images using {len(working_proxies)} working proxies")
        
        # Download images in batches
        images_downloaded = 0
        for i in range(0, max_images, batch_size):
            batch = image_urls[i:min(i + batch_size, max_images)]
            logger.info(f"Processing batch {i//batch_size + 1} ({len(batch)} images)")
            
            for url in batch:
                if images_downloaded >= max_images:
                    break
                    
                if url in downloaded_images:
                    logger.info(f"Skipping already downloaded image: {url}")
                    continue
                
                success = False
                for proxy in working_proxies:
                    success = download_image(url, proxy, downloaded_images)
                    if success:
                        images_downloaded += 1
                        break
                
                if not success:
                    logger.warning(f"Failed to download {url} with any proxy")

            logger.info(f"Downloaded {images_downloaded} out of {max_images} requested images")

    except Exception as e:
        logger.error(f"Main process failed: {str(e)}")

if __name__ == "__main__":
    main()
