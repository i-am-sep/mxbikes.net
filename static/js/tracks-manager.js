/**
 * Tracks Manager for MXBikes.net
 * Handles track listings and downloads
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
        this.sortOrder = 'popular'; // popular, newest, downloads
        this.categories = new Set(['Supercross', 'Motocross', 'FreeRide', 'Training']);
        
        // Track cache configuration
        this.cache = {
            duration: 5 * 60 * 1000, // 5 minutes
            lastUpdate: null
        };

        // Loading and error states
        this.state = {
            loading: false,
            error: null,
            retryCount: 0,
            maxRetries: 3
        };

        // Initialize tracks system
        this._initializeTracks();
    }

    /**
     * Initialize tracks system
     * @private
     */
    async _initializeTracks() {
        try {
            this._setLoading(true);
            await this._loadTracks();
            this._setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize tracks:', error);
            await this._loadFallbackTracks();
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Load fallback tracks from JSON
     * @private
     */
    async _loadFallbackTracks() {
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
            console.error('Failed to load fallback tracks:', error);
            this._setError('Failed to load tracks. Please try again later.');
        }
    }

    /**
     * Set loading state
     * @private
     */
    _setLoading(loading) {
        this.state.loading = loading;
        this._updateUI();
    }

    /**
     * Set error state
     * @private
     */
    _setError(message) {
        this.state.error = message;
        this._updateUI();
    }

    /**
     * Clear error state
     * @private
     */
    _clearError() {
        this.state.error = null;
        this._updateUI();
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for profile changes
        document.addEventListener('profileUpdated', () => {
            this._updateUI();
        });

        // Listen for cache invalidation events
        dataManager.subscribeToEvent('tracks_updated', () => {
            this.cache.lastUpdate = null;
            this._loadTracks();
        });

        // Listen for network status changes
        window.addEventListener('online', () => {
            if (this.state.error) {
                this.refresh();
            }
        });
    }

    /**
     * Load tracks from API with retry logic
     * @private
     */
    async _loadTracks() {
        // Check cache
        if (this.cache.lastUpdate && Date.now() - this.cache.lastUpdate < this.cache.duration) {
            return;
        }

        try {
            this._setLoading(true);
            this._clearError();

            const tracks = await dataManager.loadData('tracks', {
                includeDownloads: true,
                includeDetails: true
            });

            if (!Array.isArray(tracks)) {
                throw new Error('Invalid tracks data received');
            }

            // Filter out premium tracks and keep only most recent 40
            const filteredTracks = tracks
                .filter(track => !track.premium)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 40);

            this.tracks.clear();
            filteredTracks.forEach(track => {
                try {
                    const processedTrack = this._processTrackData(track);
                    if (processedTrack && processedTrack.id) {
                        this.tracks.set(processedTrack.id, processedTrack);
                    }
                } catch (error) {
                    console.warn('Failed to process track:', track, error);
                }
            });

            this.cache.lastUpdate = Date.now();
            this.state.retryCount = 0;
            this._updateTrackDisplay();
        } catch (error) {
            console.error('Failed to load tracks:', error);
            await this._loadFallbackTracks();
        } finally {
            this._setLoading(false);
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
     * Update UI based on current state
     * @private
     */
    _updateUI() {
        const trackGrid = document.getElementById('trackGrid');
        if (!trackGrid) return;

        if (this.state.loading) {
            trackGrid.innerHTML = this._generateLoadingState();
            return;
        }

        if (this.state.error) {
            trackGrid.innerHTML = this._generateErrorState();
            return;
        }

        this._updateTrackDisplay();
    }

    /**
     * Generate loading state HTML
     * @private
     */
    _generateLoadingState() {
        return `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading tracks...</p>
            </div>
        `;
    }

    /**
     * Generate error state HTML
     * @private
     */
    _generateErrorState() {
        return `
            <div class="error col-span-full">
                <p class="text-xl">Error</p>
                <p class="mt-2">${this.state.error}</p>
                <button onclick="tracksManager.refresh()" 
                        class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Export as singleton
export const tracksManager = new TracksManager();
