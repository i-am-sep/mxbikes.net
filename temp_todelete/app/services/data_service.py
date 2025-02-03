import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
from app.models.mod import Mod
from app.models.track import Track

class DataService:
    """Service for managing MX Bikes mod data with database and JSON fallback"""
    
    def __init__(self):
        """Initialize the data service"""
        self.static_dir = "static/data"
        self._ensure_static_dir()
        
        # File paths for fallback
        self.mods_file = os.path.join(self.static_dir, "mods.json")
        self.tracks_file = os.path.join(self.static_dir, "tracks.json")
        self.mods_min_file = os.path.join(self.static_dir, "mods_min.json")
        self.tracks_min_file = os.path.join(self.static_dir, "tracks_min.json")

    def _ensure_static_dir(self):
        """Ensure the static data directory exists"""
        if not os.path.exists(self.static_dir):
            os.makedirs(self.static_dir)

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

    def _is_database_available(self) -> bool:
        """Check if database is available"""
        try:
            db.session.execute("SELECT 1")
            return True
        except SQLAlchemyError:
            return False

    def get_mods(self) -> Dict:
        """Get all mods with database fallback"""
        try:
            if self._is_database_available():
                mods = {}
                for mod in Mod.query.all():
                    mods[mod.url] = mod.to_dict()
                return mods
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            # Try full mods.json first
            mods = self._load_json(self.mods_file)
            if mods is not None:
                return mods
            
            # Fallback to minimal version if full version fails
            return self._load_json(self.mods_min_file, default={})

    def get_tracks(self) -> Dict:
        """Get all tracks with database fallback"""
        try:
            if self._is_database_available():
                tracks = {}
                for track in Track.query.all():
                    tracks[track.url] = track.to_dict()
                return tracks
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            # Try full tracks.json first
            tracks = self._load_json(self.tracks_file)
            if tracks is not None:
                return tracks
            
            # Fallback to minimal version if full version fails
            return self._load_json(self.tracks_min_file, default={})

    def get_mod(self, url: str) -> Optional[Dict]:
        """Get a specific mod by URL with database fallback"""
        try:
            if self._is_database_available():
                mod = Mod.query.filter_by(url=url).first()
                return mod.to_dict() if mod else None
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            mods = self.get_mods()
            return mods.get(url)

    def get_track(self, url: str) -> Optional[Dict]:
        """Get a specific track by URL with database fallback"""
        try:
            if self._is_database_available():
                track = Track.query.filter_by(url=url).first()
                return track.to_dict() if track else None
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            tracks = self.get_tracks()
            return tracks.get(url)

    def search_mods(self, query: str) -> List[Dict]:
        """Search mods by title or description"""
        try:
            if self._is_database_available():
                query = f"%{query}%"
                mods = Mod.query.filter(
                    (Mod.title.ilike(query)) |
                    (Mod.description.ilike(query))
                ).all()
                return [mod.to_dict() for mod in mods]
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            mods = self.get_mods()
            query = query.lower()
            return [
                mod for mod in mods.values()
                if query in mod.get('title', '').lower() or 
                query in mod.get('description', '').lower()
            ]

    def search_tracks(self, query: str) -> List[Dict]:
        """Search tracks by title or description"""
        try:
            if self._is_database_available():
                query = f"%{query}%"
                tracks = Track.query.filter(
                    (Track.title.ilike(query)) |
                    (Track.description.ilike(query))
                ).all()
                return [track.to_dict() for track in tracks]
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            tracks = self.get_tracks()
            query = query.lower()
            return [
                track for track in tracks.values()
                if query in track.get('title', '').lower() or 
                query in track.get('description', '').lower()
            ]

    def get_stats(self) -> Dict:
        """Get statistics about the data"""
        try:
            if self._is_database_available():
                return {
                    'total_mods': Mod.query.count(),
                    'total_tracks': Track.query.count(),
                    'using_fallback': False,
                    'last_updated': datetime.utcnow().isoformat()
                }
            
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            mods = self.get_mods()
            tracks = self.get_tracks()
            return {
                'total_mods': len(mods) if mods else 0,
                'total_tracks': len(tracks) if tracks else 0,
                'using_fallback': True,
                'last_updated': datetime.utcnow().isoformat()
            }

    def add_mod(self, data: Dict) -> bool:
        """Add a new mod to the database with JSON fallback"""
        try:
            if self._is_database_available():
                mod = Mod.from_dict(data)
                db.session.add(mod)
                db.session.commit()
                return True
                
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            mods = self.get_mods()
            mods[data['url']] = data
            return self._save_json(mods, self.mods_file)

    def add_track(self, data: Dict) -> bool:
        """Add a new track to the database with JSON fallback"""
        try:
            if self._is_database_available():
                track = Track.from_dict(data)
                db.session.add(track)
                db.session.commit()
                return True
                
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            tracks = self.get_tracks()
            tracks[data['url']] = data
            return self._save_json(tracks, self.tracks_file)

    def update_mod(self, url: str, data: Dict) -> bool:
        """Update an existing mod"""
        try:
            if self._is_database_available():
                mod = Mod.query.filter_by(url=url).first()
                if mod:
                    for key, value in data.items():
                        setattr(mod, key, value)
                    db.session.commit()
                    return True
                return False
                
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            mods = self.get_mods()
            if url in mods:
                mods[url].update(data)
                return self._save_json(mods, self.mods_file)
            return False

    def update_track(self, url: str, data: Dict) -> bool:
        """Update an existing track"""
        try:
            if self._is_database_available():
                track = Track.query.filter_by(url=url).first()
                if track:
                    for key, value in data.items():
                        setattr(track, key, value)
                    db.session.commit()
                    return True
                return False
                
        except SQLAlchemyError as e:
            current_app.logger.warning(f"Database error, falling back to JSON: {str(e)}")
            tracks = self.get_tracks()
            if url in tracks:
                tracks[url].update(data)
                return self._save_json(tracks, self.tracks_file)
            return False
