import os
import json
import pytest
from datetime import datetime
from app.services.data_service import DataService

@pytest.fixture
def data_service(tmp_path):
    """Create a DataService instance with temporary directory"""
    return DataService(str(tmp_path))

def test_init(data_service, tmp_path):
    """Test DataService initialization"""
    assert os.path.exists(tmp_path)
    assert isinstance(data_service.mods, list)
    assert isinstance(data_service.track_details, dict)
    assert isinstance(data_service.track_links, list)

def test_add_mod(data_service):
    """Test adding a new mod"""
    mod_data = {
        'name': 'Test Mod',
        'description': 'Test Description'
    }
    
    assert data_service.add_mod(mod_data)
    assert len(data_service.mods) == 1
    assert 'added_at' in data_service.mods[0]

def test_add_track_details(data_service):
    """Test adding track details"""
    url = 'https://example.com/track'
    details = {
        'title': 'Test Track',
        'creator': 'Test Creator'
    }
    
    assert data_service.add_track_details(url, details)
    assert url in data_service.track_details
    assert 'updated_at' in data_service.track_details[url]

def test_add_track_link(data_service):
    """Test adding a track link"""
    url = 'https://example.com/track'
    
    assert data_service.add_track_link(url)
    assert url in data_service.track_links
    
    # Test duplicate
    assert data_service.add_track_link(url)
    assert len(data_service.track_links) == 1

def test_get_mod(data_service):
    """Test getting a mod by name"""
    mod_data = {
        'name': 'Test Mod',
        'description': 'Test Description'
    }
    data_service.add_mod(mod_data)
    
    result = data_service.get_mod('Test Mod')
    assert result is not None
    assert result['name'] == 'Test Mod'
    
    assert data_service.get_mod('Non-existent') is None

def test_update_mod(data_service):
    """Test updating a mod"""
    mod_data = {
        'name': 'Test Mod',
        'description': 'Original Description'
    }
    data_service.add_mod(mod_data)
    
    updated_data = {
        'name': 'Test Mod',
        'description': 'Updated Description'
    }
    
    assert data_service.update_mod('Test Mod', updated_data)
    updated_mod = data_service.get_mod('Test Mod')
    assert updated_mod['description'] == 'Updated Description'
    assert 'updated_at' in updated_mod

def test_delete_mod(data_service):
    """Test deleting a mod"""
    mod_data = {
        'name': 'Test Mod',
        'description': 'Test Description'
    }
    data_service.add_mod(mod_data)
    
    assert data_service.delete_mod('Test Mod')
    assert len(data_service.mods) == 0
    
    assert not data_service.delete_mod('Non-existent')

def test_search_mods(data_service):
    """Test searching mods"""
    mods = [
        {'name': 'Test Mod 1', 'description': 'First test mod'},
        {'name': 'Test Mod 2', 'description': 'Second test mod'},
        {'name': 'Other Mod', 'description': 'Different description'}
    ]
    
    for mod in mods:
        data_service.add_mod(mod)
    
    results = data_service.search_mods('test')
    assert len(results) == 2
    
    results = data_service.search_mods('different')
    assert len(results) == 1

def test_get_stats(data_service):
    """Test getting statistics"""
    mod_data = {'name': 'Test Mod'}
    track_url = 'https://example.com/track'
    track_details = {'title': 'Test Track'}
    
    data_service.add_mod(mod_data)
    data_service.add_track_details(track_url, track_details)
    data_service.add_track_link(track_url)
    
    stats = data_service.get_stats()
    assert stats['total_mods'] == 1
    assert stats['total_tracks'] == 1
    assert stats['total_links'] == 1
    assert 'last_updated' in stats

def test_log_message(data_service):
    """Test logging messages"""
    message = "Test log message"
    data_service.log_message(message)
    
    with open(data_service.log_file, 'r') as f:
        log_content = f.read()
        assert message in log_content
