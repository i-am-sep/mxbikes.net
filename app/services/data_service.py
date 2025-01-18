import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class DataService:
    """Service for managing MX Bikes mod data"""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the data service with the data directory path"""
        self.data_dir = data_dir
        self._ensure_data_dir()
        
        # File paths
        self.mods_file = os.path.join(data_dir, "mods.json")
        self.track_details_file = os.path.join(data_dir, "track_details.json")
        self.track_links_file = os.path.join(data_dir, "track_links.json")
        self.log_file = os.path.join(data_dir, "track_scraper.log")
        
        # Load data
        self.mods = self._load_json(self.mods_file, default=[])
        self.track_details = self._load_json(self.track_details_file, default={})
        self.track_links = self._load_json(self.track_links_file, default=[])

    def _ensure_data_dir(self):
        """Ensure the data directory exists"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def _load_json(self, filepath: str, default: any = None) -> any:
        """Load JSON data from file with error handling"""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return default
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {filepath}")
            return default
        except Exception as e:
            print(f"Error loading {filepath}: {str(e)}")
            return default

    def _save_json(self, data: any, filepath: str) -> bool:
        """Save data to JSON file with error handling"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving to {filepath}: {str(e)}")
            return False

    def add_mod(self, mod_data: Dict) -> bool:
        """Add a new mod to the database"""
        if not isinstance(mod_data, dict):
            return False
            
        # Add timestamp
        mod_data['added_at'] = datetime.utcnow().isoformat()
        
        self.mods.append(mod_data)
        return self._save_json(self.mods, self.mods_file)

    def add_track_details(self, url: str, details: Dict) -> bool:
        """Add or update track details"""
        if not isinstance(details, dict):
            return False
            
        # Add timestamp
        details['updated_at'] = datetime.utcnow().isoformat()
        
        self.track_details[url] = details
        return self._save_json(self.track_details, self.track_details_file)

    def add_track_link(self, url: str) -> bool:
        """Add a new track link if it doesn't exist"""
        if url not in self.track_links:
            self.track_links.append(url)
            return self._save_json(self.track_links, self.track_links_file)
        return True

    def get_mod(self, name: str) -> Optional[Dict]:
        """Get a mod by name"""
        for mod in self.mods:
            if mod.get('name') == name:
                return mod
        return None

    def get_track_details(self, url: str) -> Optional[Dict]:
        """Get track details by URL"""
        return self.track_details.get(url)

    def get_all_mods(self) -> List[Dict]:
        """Get all mods"""
        return self.mods

    def get_all_track_details(self) -> Dict[str, Dict]:
        """Get all track details"""
        return self.track_details

    def get_all_track_links(self) -> List[str]:
        """Get all track links"""
        return self.track_links

    def update_mod(self, name: str, updated_data: Dict) -> bool:
        """Update an existing mod"""
        for i, mod in enumerate(self.mods):
            if mod.get('name') == name:
                # Add update timestamp
                updated_data['updated_at'] = datetime.utcnow().isoformat()
                self.mods[i] = updated_data
                return self._save_json(self.mods, self.mods_file)
        return False

    def delete_mod(self, name: str) -> bool:
        """Delete a mod by name"""
        for i, mod in enumerate(self.mods):
            if mod.get('name') == name:
                del self.mods[i]
                return self._save_json(self.mods, self.mods_file)
        return False

    def delete_track_details(self, url: str) -> bool:
        """Delete track details by URL"""
        if url in self.track_details:
            del self.track_details[url]
            return self._save_json(self.track_details, self.track_details_file)
        return False

    def delete_track_link(self, url: str) -> bool:
        """Delete a track link"""
        if url in self.track_links:
            self.track_links.remove(url)
            return self._save_json(self.track_links, self.track_links_file)
        return False

    def log_message(self, message: str, level: str = "INFO") -> None:
        """Add a log message with timestamp"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S,%f")[:-3]
        log_line = f"{timestamp} - {level} - {message}\n"
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_line)
        except Exception as e:
            print(f"Error writing to log file: {str(e)}")

    def search_mods(self, query: str) -> List[Dict]:
        """Search mods by name or description"""
        query = query.lower()
        results = []
        
        for mod in self.mods:
            if (query in mod.get('name', '').lower() or 
                query in mod.get('description', '').lower()):
                results.append(mod)
                
        return results

    def get_stats(self) -> Dict:
        """Get statistics about the data"""
        return {
            'total_mods': len(self.mods),
            'total_tracks': len(self.track_details),
            'total_links': len(self.track_links),
            'last_updated': datetime.utcnow().isoformat()
        }
