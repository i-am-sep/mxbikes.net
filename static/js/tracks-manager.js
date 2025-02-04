/**
 * Tracks Manager for MXBikes.net
 * Handles track listings, downloads, and premium content
 */

import { dataManager } from './data-manager.js';
import { profileManager } from './profile-manager.js';

class TracksManager {
    constructor() {
        this.tracks = new Map();
        this.filters = {
            search: '',
            premium: false,
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
            this._setError('Failed to initialize tracks system. Please refresh the page.');
        } finally {
            this._setLoading(false);
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
        // Listen for profile changes to update premium access
        document.addEventListener('profileUpdated', () => {
            this._updatePremiumUI();
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

            this.tracks.clear();
            tracks.forEach(track => {
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
            
            // Implement retry logic
            if (this.state.retryCount < this.state.maxRetries) {
                this.state.retryCount++;
                const delay = Math.pow(2, this.state.retryCount) * 1000;
                setTimeout(() => this._loadTracks(), delay);
                this._setError(`Loading tracks... Retry ${this.state.retryCount}/${this.state.maxRetries}`);
            } else {
                this._setError('Failed to load tracks. Please try again later.');
            }
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
                creator: this._validateString(track.creator, 'Unknown Creator'),
                description: this._validateString(track.description, ''),
                category: this._validateCategory(track.category),
                thumbnail: this._validateUrl(track.thumbnail) || '../static/assets/images/placeholder.jpg',
                images: this._validateImageArray(track.additionalImages),
                downloads: this._processDownloadInfo(track.downloads),
                premium: Boolean(track.premium),
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

    /**
     * Validate string field
     * @private
     */
    _validateString(value, fallback = '') {
        return typeof value === 'string' ? value.trim() : fallback;
    }

    /**
     * Validate category
     * @private
     */
    _validateCategory(category) {
        return this.categories.has(category) ? category : 'Motocross';
    }

    /**
     * Validate number within range
     * @private
     */
    _validateNumber(value, min, max, fallback) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max ? num : fallback;
    }

    /**
     * Validate date
     * @private
     */
    _validateDate(date) {
        try {
            return new Date(date).toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    /**
     * Validate image array
     * @private
     */
    _validateImageArray(images) {
        if (!Array.isArray(images)) return [];
        return images.filter(url => this._validateUrl(url));
    }

    /**
     * Process download information
     * @private
     */
    _processDownloadInfo(downloads) {
        const defaultDownloads = {
            count: 0,
            links: { primary: null, mirrors: [] },
            hosts: {}
        };

        if (!downloads || typeof downloads !== 'object') {
            return defaultDownloads;
        }

        try {
            return {
                count: this._validateNumber(downloads.download_count || downloads.count, 0, Infinity, 0),
                links: this._processDownloadLinks(downloads.by_type || downloads.links),
                hosts: downloads.by_host || downloads.hosts || {}
            };
        } catch (error) {
            console.warn('Failed to process download info:', error);
            return defaultDownloads;
        }
    }

    /**
     * Process download links with validation
     * @private
     */
    _processDownloadLinks(links) {
        if (!links || typeof links !== 'object') {
            return { primary: null, mirrors: [] };
        }

        try {
            const allLinks = Array.isArray(links) ? links : 
                           Object.values(links).flat().filter(Boolean);
            
            const validLinks = allLinks.filter(link => this._validateUrl(link));

            if (validLinks.length === 0) {
                return { primary: null, mirrors: [] };
            }

            // Find best primary link
            const hostPriority = ['mediafire.com', 'drive.google.com', 'mega.nz'];
            let primary = null;

            for (const host of hostPriority) {
                primary = validLinks.find(link => {
                    try {
                        return new URL(link).hostname.includes(host);
                    } catch {
                        return false;
                    }
                });
                if (primary) break;
            }

            // If no priority host found, use first valid link
            primary = primary || validLinks[0];

            // Remaining links become mirrors
            const mirrors = validLinks.filter(link => link !== primary);

            return { primary, mirrors };
        } catch (error) {
            console.warn('Failed to process download links:', error);
            return { primary: null, mirrors: [] };
        }
    }

    /**
     * Validate URL
     * @private
     */
    _validateUrl(url) {
        if (!url || typeof url !== 'string') return null;
        
        try {
            new URL(url);
            return url;
        } catch {
            return null;
        }
    }

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

    // ... [Rest of the methods remain unchanged] ...
}

// Export as singleton
export const tracksManager = new TracksManager();
