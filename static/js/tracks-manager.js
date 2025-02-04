/**
 * Tracks Manager for MXBikes.net
 * Handles track listings and downloads with JSON fallback and infinite scroll
 */

import { dataManager } from './data-manager.js';
import { profileManager } from './profile-manager.js';

class TracksManager {
    constructor() {
        this.tracks = new Map();
        this.filters = {
            search: '',
            category: 'all'
        };
        this.sortOrder = 'newest'; // newest, popular, downloads
        this.categories = new Set(['Supercross', 'Motocross', 'FreeRide', 'Training']);
        
        // Pagination
        this.page = 1;
        this.isLoading = false;
        this.hasMoreData = true;
        this.usingJsonFallback = true;

        // Initialize tracks system
        this._initializeTracks();
        this._setupScrollListener();
        this._setupSearchListener();
    }

    /**
     * Initialize tracks system
     * @private
     */
    async _initializeTracks() {
        try {
            this._setLoading(true);
            await this._loadJsonTracks();
            this._setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize tracks:', error);
            this._setError('Failed to load tracks. Please try again later.');
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Set up infinite scroll listener
     * @private
     */
    _setupScrollListener() {
        const handleScroll = () => {
            if (this.isLoading || !this.hasMoreData) return;

            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 100) {
                if (this.usingJsonFallback) {
                    // Switch to DB when JSON is exhausted
                    this.usingJsonFallback = false;
                    this.page = 1;
                    this._loadDbTracks();
                } else {
                    this.page++;
                    this._loadDbTracks();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
    }

    /**
     * Set up search listener
     * @private
     */
    _setupSearchListener() {
        const searchInput = document.getElementById('trackSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    // Switch to DB search immediately
                    this.usingJsonFallback = false;
                    this.page = 1;
                    this.filters.search = query;
                    this._loadDbTracks();
                } else if (query.length === 0) {
                    // Reset to JSON fallback
                    this.usingJsonFallback = true;
                    this.filters.search = '';
                    this._loadJsonTracks();
                }
            });
        }
    }

    /**
     * Load tracks from JSON fallback
     * @private
     */
    async _loadJsonTracks() {
        try {
            const response = await fetch('../static/data/tracks-fallback.json');
            const data = await response.json();
            
            this.tracks.clear();
            data.tracks.forEach(track => {
                if (track && track.id) {
                    this.tracks.set(track.id, track);
                }
            });
            
            this._updateTrackDisplay();
        } catch (error) {
            console.error('Failed to load JSON tracks:', error);
            this._setError('Failed to load tracks. Please try again later.');
        }
    }

    /**
     * Load tracks from database
     * @private
     */
    async _loadDbTracks() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            const tracks = await dataManager.loadData('tracks', {
                page: this.page,
                search: this.filters.search,
                category: this.filters.category,
                sort: this.sortOrder
            });

            if (!Array.isArray(tracks) || tracks.length === 0) {
                this.hasMoreData = false;
                return;
            }

            tracks.forEach(track => {
                const processedTrack = this._processTrackData(track);
                if (processedTrack && processedTrack.id) {
                    this.tracks.set(processedTrack.id, processedTrack);
                }
            });

            this._updateTrackDisplay();
        } catch (error) {
            console.error('Failed to load DB tracks:', error);
            if (this.page === 1) {
                // Fallback to JSON if initial DB load fails
                this.usingJsonFallback = true;
                await this._loadJsonTracks();
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Process track data with validation
     * @private
     */
    _processTrackData(track) {
        if (!track || typeof track !== 'object') {
            console.warn('Invalid track data:', track);
            return null;
        }

        try {
            return {
                id: track.id,
                name: this._validateString(track.name, 'Unnamed Track'),
                creator: this._validateString(track.creator, 'Created by Alex'),
                description: this._validateString(track.description, ''),
                category: this._validateCategory(track.category),
                thumbnail: this._validateUrl(track.thumbnail) || '../static/assets/images/placeholder.jpg',
                images: this._validateImageArray(track.additionalImages),
                downloads: this._processDownloadInfo(track.downloads),
                rating: this._validateNumber(track.rating, 0, 5, 0),
                difficulty: this._validateString(track.difficulty, 'Medium'),
                length: this._validateString(track.length, 'Unknown'),
                createdAt: this._validateDate(track.createdAt),
                updatedAt: this._validateDate(track.updatedAt)
            };
        } catch (error) {
            console.error('Track processing error:', error);
            return null;
        }
    }

    // ... [Rest of the validation methods remain unchanged] ...

    /**
     * Update track display
     * @private
     */
    _updateTrackDisplay() {
        const trackGrid = document.getElementById('trackGrid');
        if (!trackGrid) return;

        const tracks = Array.from(this.tracks.values());
        const sortedTracks = this._sortTracks(tracks);

        trackGrid.innerHTML = sortedTracks.map(track => this._generateTrackCard(track)).join('');
    }

    /**
     * Sort tracks based on current sort order
     * @private
     */
    _sortTracks(tracks) {
        switch (this.sortOrder) {
            case 'newest':
                return tracks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'popular':
                return tracks.sort((a, b) => b.downloads.count - a.downloads.count);
            default:
                return tracks;
        }
    }

    /**
     * Generate track card HTML
     * @private
     */
    _generateTrackCard(track) {
        return `
            <div class="track-card">
                <img src="${track.thumbnail}" alt="${track.name}" class="track-thumbnail">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.creator}</p>
                    <div class="track-stats">
                        <span>${track.downloads.count} downloads</span>
                        <span>${track.category}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Export as singleton
export const tracksManager = new TracksManager();
