import json
import re
from typing import Dict, List, Optional, TypedDict

class DownloadInfo(TypedDict):
    url: str
    source: str  # 'by_type' or 'by_host'
    host: str    # e.g. 'mediafire', 'mega', etc
    label: Optional[str]  # e.g. 'Default', 'Recommended'
    track_url: str
    track_title: str
    description_context: Optional[str]  # Surrounding text from description

def extract_host_from_url(url: str) -> str:
    """Extract the host name from a URL."""
    url_lower = url.lower()
    if 'mediafire.com' in url_lower:
        return 'mediafire'
    elif 'mega.nz' in url_lower:
        return 'mega'
    elif 'drive.google.com' in url_lower:
        return 'google_drive'
    elif '1drv.ms' in url_lower:
        return 'onedrive'
    else:
        return 'other'

def extract_downloads_from_description(
    description: str, 
    track_url: str, 
    track_title: str
) -> List[DownloadInfo]:
    """Extract download links and their labels from description text."""
    downloads = []
    
    # Common URL patterns
    url_pattern = r'https?://[^\s<>"\']+|www\.[^\s<>"\']+'
    
    # Find URLs with surrounding context
    lines = description.split('\n')
    current_label = None
    
    for i, line in enumerate(lines):
        # Look for label indicators
        label_indicators = ['default', 'recommended', 'mirror', 'alternative']
        line_lower = line.lower()
        
        # Update current label if found
        for indicator in label_indicators:
            if indicator in line_lower and len(line) < 50:  # Avoid false positives in long lines
                current_label = line.strip()
        
        # Find URLs in current line
        urls = re.findall(url_pattern, line)
        if urls:
            # Get context from surrounding lines
            start_idx = max(0, i - 2)
            end_idx = min(len(lines), i + 3)
            context = '\n'.join(lines[start_idx:end_idx]).strip()
            
            for url in urls:
                # Skip if URL is an image
                if any(ext in url.lower() for ext in ['.jpg', '.png', '.gif', '.webp']):
                    continue
                    
                host = extract_host_from_url(url)
                downloads.append({
                    'url': url,
                    'source': 'description',
                    'host': host,
                    'label': current_label,
                    'track_url': track_url,
                    'track_title': track_title,
                    'description_context': context
                })
    
    return downloads

def deduplicate_downloads(downloads: List[DownloadInfo]) -> List[DownloadInfo]:
    """Remove duplicate downloads while preserving the most detailed entries."""
    # Use URL as key, but keep most detailed entry
    unique_downloads: Dict[str, DownloadInfo] = {}
    
    for download in downloads:
        url = download['url']
        if url not in unique_downloads or (
            # Prefer entries with labels
            (download['label'] and not unique_downloads[url]['label']) or
            # Prefer entries with context
            (download['description_context'] and not unique_downloads[url]['description_context']) or
            # Prefer by_host/by_type over description
            (download['source'] != 'description' and unique_downloads[url]['source'] == 'description')
        ):
            unique_downloads[url] = download
    
    return list(unique_downloads.values())

def parse_mods_file(file_path: str) -> List[DownloadInfo]:
    """Parse the mods JSON file and extract download information."""
    with open(file_path, 'r', encoding='utf-8') as f:
        mods_data = json.load(f)
    
    all_downloads = []
    
    for track_url, track_data in mods_data.items():
        # Get basic track info
        track_title = track_data.get('title', '')
        
        # Process downloads by_type
        by_type = track_data.get('downloads', {}).get('by_type', {})
        for type_name, links in by_type.items():
            if not isinstance(links, list):
                continue
            for link in links:
                if not isinstance(link, str):
                    continue
                # Extract host from URL
                host = extract_host_from_url(link)
                all_downloads.append({
                    'url': link,
                    'source': 'by_type',
                    'host': host,
                    'label': type_name if type_name != 'other' else None,
                    'track_url': track_url,
                    'track_title': track_title,
                    'description_context': None
                })
        
        # Process downloads by_host
        by_host = track_data.get('downloads', {}).get('by_host', {})
        for host, links in by_host.items():
            if not isinstance(links, list):
                continue
            for link in links:
                if not isinstance(link, str):
                    continue
                all_downloads.append({
                    'url': link,
                    'source': 'by_host',
                    'host': host,
                    'label': None,
                    'track_url': track_url,
                    'track_title': track_title,
                    'description_context': None
                })
        
        # Extract and process download links from description
        description = track_data.get('description', '')
        if description:
            desc_downloads = extract_downloads_from_description(
                description, track_url, track_title
            )
            all_downloads.extend(desc_downloads)
    
    # Remove duplicates while preserving the most detailed entry
    return deduplicate_downloads(all_downloads)

if __name__ == '__main__':
    downloads = parse_mods_file('static/data/mods_min.json')
    # Write results to file instead of printing
    with open('download_links.json', 'w', encoding='utf-8') as f:
        json.dump(downloads, f, indent=2, ensure_ascii=False)
