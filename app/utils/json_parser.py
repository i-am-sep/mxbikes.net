import json
from typing import Iterator, Dict, Any, List
import ijson  # For streaming JSON parsing
from app.models.product import Product

def stream_json_objects(file_path: str, batch_size: int = 10) -> Iterator[List[Dict[str, Any]]]:
    """
    Stream JSON objects from a file in batches to reduce memory usage.
    
    Args:
        file_path: Path to the JSON file
        batch_size: Number of objects to yield in each batch
        
    Yields:
        List of dictionaries containing JSON objects
    """
    batch = []
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
        for url, track_data in data.items():
            # Add URL to track data
            track_data['url'] = url
            batch.append(track_data)
            
            if len(batch) >= batch_size:
                yield batch
                batch = []
        
        # Yield any remaining items in the last batch
        if batch:
            yield batch

def validate_track_data(data: Dict[str, Any]) -> bool:
    """
    Validate track data before insertion.
    
    Args:
        data: Track data dictionary
        
    Returns:
        bool: True if data is valid, False otherwise
    """
    # Extract title from URL if title is N/A
    if data.get('title') == 'N/A':
        url = data.get('url', '')
        # Extract name from URL (e.g., "smoksta-flowsdale-mx" from "https://mxb-mods.com/smoksta-flowsdale-mx/")
        title = url.rstrip('/').split('/')[-1].replace('-', ' ').title()
        data['title'] = title
    
    # Extract creator from URL if creator is N/A
    if data.get('creator') == 'N/A':
        url = data.get('url', '')
        parts = url.rstrip('/').split('/')[-1].split('-')
        if parts:
            data['creator'] = parts[0].title()
    
    # Generate description if N/A
    if data.get('description') == 'N/A':
        data['description'] = f"Track available at {data.get('url', 'Unknown URL')}"
    
    # Basic validation
    required_fields = ['title', 'description', 'creator', 'url']
    return all(data.get(field) for field in required_fields)

def map_to_product(data: Dict[str, Any], product_type: str = 'track') -> Dict[str, Any]:
    """
    Map JSON data to Product model fields with enhanced validation.
    
    Args:
        data: JSON object containing track data
        product_type: Type of product ('mod' or 'track')
        
    Returns:
        Dict containing mapped Product fields
    """
    # Extract download count from nested structure
    download_count = data.get('downloads', {}).get('download_count', 0)
    
    # Extract download links if available
    download_links = data.get('downloads', {}).get('by_host', {})
    all_links = []
    for host_links in download_links.values():
        if isinstance(host_links, list):
            all_links.extend(host_links)
    
    # Add the URL as a download link if no other links are available
    if not all_links and data.get('url'):
        all_links.append(data['url'])
    
    # Process images
    images_data = data.get('images', {})
    if not isinstance(images_data, dict):
        images_data = {}
    
    # Map the data
    return {
        'name': data.get('title', 'Untitled').strip(),
        'description': data.get('description', '').strip(),
        'price': 0.0,  # All tracks are free
        'product_type': product_type,
        'mod_type': 'free',
        'creator': data.get('creator', 'Unknown').strip(),
        'images': json.dumps({
            'cover': images_data.get('cover', ''),
            'additional': images_data.get('additional', [])
        }),
        'downloads': json.dumps({
            'links': all_links,
            'count': download_count
        }),
        'guid_required': False,
        'download_count': download_count
    }

def process_tracks_batch(batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process a batch of track data with validation.
    
    Args:
        batch: List of track data dictionaries
        
    Returns:
        List of validated and mapped Product dictionaries
    """
    processed_tracks = []
    
    for track_data in batch:
        if validate_track_data(track_data):
            mapped_data = map_to_product(track_data, 'track')
            processed_tracks.append(mapped_data)
            
    return processed_tracks
