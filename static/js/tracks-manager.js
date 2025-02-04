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

        // Initialize tracks system
        this._initializeTracks();
    }

    /**
     * Initialize tracks system
     * @private
     */
    async _initializeTracks() {
        await this._loadTracks();
        this._setupEventListeners();
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
    }

    /**
     * Load tracks from API
     * @private
     */
    async _loadTracks() {
        // Check cache
        if (this.cache.lastUpdate && Date.now() - this.cache.lastUpdate < this.cache.duration) {
            return;
        }

        try {
            const tracks = await dataManager.loadData('tracks', {
                includeDownloads: true,
                includeDetails: true
            });

            this.tracks.clear();
            tracks.forEach(track => {
                this.tracks.set(track.id, this._processTrackData(track));
            });

            this.cache.lastUpdate = Date.now();
            this._updateTrackDisplay();
        } catch (error) {
            console.error('Failed to load tracks:', error);
            this._showError('Failed to load tracks. Please try again later.');
        }
    }

    /**
     * Process track data
     * @private
     */
    _processTrackData(track) {
        return {
            id: track.id,
            name: track.name || 'Unnamed Track',
            creator: track.creator || 'Unknown Creator',
            description: track.description || '',
            category: track.category || 'Motocross',
            thumbnail: track.thumbnail || '../static/assets/images/placeholder.jpg',
            images: track.additionalImages || [],
            downloads: {
                count: track.downloads?.download_count || 0,
                links: this._processDownloadLinks(track.downloadLinks),
                hosts: track.downloadHosts || {}
            },
            premium: !!track.premium,
            rating: track.rating || 0,
            difficulty: track.difficulty || 'Medium',
            length: track.length || 'Unknown',
            createdAt: track.createdAt,
            updatedAt: track.updatedAt
        };
    }

    /**
     * Process download links
     * @private
     */
    _processDownloadLinks(links) {
        if (!links) return { primary: null, mirrors: [] };

        // Find best primary link
        const hostPriority = ['mediafire.com', 'drive.google.com', 'mega.nz'];
        let primary = null;
        const mirrors = [];

        Object.entries(links).forEach(([type, typeLinks]) => {
            typeLinks.forEach(link => {
                const url = new URL(link);
                const host = url.hostname;
                
                if (!primary && hostPriority.includes(host)) {
                    primary = link;
                } else {
                    mirrors.push(link);
                }
            });
        });

        return {
            primary: primary || mirrors[0] || null,
            mirrors: primary ? mirrors : mirrors.slice(1)
        };
    }

    /**
     * Update track display
     * @private
     */
    _updateTrackDisplay() {
        const trackGrid = document.getElementById('trackGrid');
        if (!trackGrid) return;

        const filteredTracks = this._getFilteredTracks();

        if (filteredTracks.length === 0) {
            trackGrid.innerHTML = this._generateEmptyState();
            return;
        }

        trackGrid.innerHTML = filteredTracks
            .map(track => this._generateTrackCard(track))
            .join('');
    }

    /**
     * Get filtered tracks
     * @private
     */
    _getFilteredTracks() {
        return Array.from(this.tracks.values())
            .filter(track => {
                // Search filter
                if (this.filters.search && 
                    !track.name.toLowerCase().includes(this.filters.search.toLowerCase()) &&
                    !track.creator.toLowerCase().includes(this.filters.search.toLowerCase())) {
                    return false;
                }

                // Premium filter
                if (this.filters.premium && !track.premium) {
                    return false;
                }

                // Category filter
                if (this.filters.category !== 'all' && track.category !== this.filters.category) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                switch (this.sortOrder) {
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'downloads':
                        return b.downloads.count - a.downloads.count;
                    case 'popular':
                    default:
                        // Combine downloads and rating for popularity
                        const aPopularity = (a.downloads.count * 0.7) + (a.rating * 0.3);
                        const bPopularity = (b.downloads.count * 0.7) + (b.rating * 0.3);
                        return bPopularity - aPopularity;
                }
            });
    }

    /**
     * Generate track card HTML
     * @private
     */
    _generateTrackCard(track) {
        const canAccess = !track.premium || profileManager.hasPremiumAccess();
        
        return `
            <div class="track-card">
                ${track.premium ? '<span class="premium-badge">PREMIUM</span>' : ''}
                <img src="${track.thumbnail}" 
                     alt="${track.name}" 
                     class="track-image"
                     loading="lazy">
                <div class="track-info">
                    <h3 class="track-name">${track.name}</h3>
                    <p class="track-creator">By ${track.creator}</p>
                    <div class="track-stats">
                        <span class="downloads">${track.downloads.count} Downloads</span>
                        <span class="difficulty">${track.difficulty}</span>
                        <span class="length">${track.length}</span>
                    </div>
                    ${canAccess ? this._generateDownloadButton(track) : this._generatePremiumPrompt()}
                </div>
            </div>
        `;
    }

    /**
     * Generate download button HTML
     * @private
     */
    _generateDownloadButton(track) {
        if (!track.downloads.links.primary) {
            return '<button class="download-button" disabled>No Download Available</button>';
        }

        return `
            <a href="${track.downloads.links.primary}" 
               class="download-button" 
               target="_blank"
               onclick="tracksManager.trackDownload('${track.id}')">
                Download Track
            </a>
            ${track.downloads.links.mirrors.length > 0 ? `
                <div class="mirror-links">
                    <span class="text-sm text-gray-400">Mirror links:</span>
                    ${track.downloads.links.mirrors.map(mirror => `
                        <a href="${mirror}" 
                           class="text-sm text-blue-400 hover:text-blue-300"
                           target="_blank"
                           onclick="tracksManager.trackDownload('${track.id}')">
                            ${new URL(mirror).hostname}
                        </a>
                    `).join(' | ')}
                </div>
            ` : ''}
        `;
    }

    /**
     * Generate premium prompt HTML
     * @private
     */
    _generatePremiumPrompt() {
        return `
            <a href="/subscribe" class="download-button bg-gradient-to-r from-yellow-400 to-yellow-600">
                Unlock Premium Content
            </a>
        `;
    }

    /**
     * Generate empty state HTML
     * @private
     */
    _generateEmptyState() {
        return `
            <div class="text-center text-gray-300 col-span-full">
                <p class="text-xl">No tracks found${this.filters.search ? ' matching your search' : ''}</p>
                ${this.filters.search ? `
                    <p class="mt-2">Try adjusting your search terms or filters</p>
                ` : ''}
            </div>
        `;
    }

    /**
     * Update premium UI elements
     * @private
     */
    _updatePremiumUI() {
        const premiumToggle = document.getElementById('premiumToggle');
        if (!premiumToggle) return;

        const hasPremium = profileManager.hasPremiumAccess();
        premiumToggle.classList.toggle('disabled', !hasPremium);
        premiumToggle.classList.toggle('active', this.filters.premium);
        premiumToggle.title = hasPremium ? 
            'Toggle premium tracks' : 
            'Subscribe to access premium tracks';
    }

    /**
     * Show error message
     * @private
     */
    _showError(message) {
        const trackGrid = document.getElementById('trackGrid');
        if (!trackGrid) return;

        trackGrid.innerHTML = `
            <div class="error col-span-full">
                <p class="text-xl">Error</p>
                <p class="mt-2">${message}</p>
            </div>
        `;
    }

    /**
     * Filter tracks by search term
     * @public
     */
    filterBySearch(term) {
        this.filters.search = term;
        this._updateTrackDisplay();
    }

    /**
     * Filter tracks by category
     * @public
     */
    filterByCategory(category) {
        this.filters.category = category;
        this._updateTrackDisplay();
    }

    /**
     * Toggle premium tracks
     * @public
     */
    togglePremium() {
        if (!profileManager.hasPremiumAccess()) {
            window.location.href = '/subscribe';
            return;
        }

        this.filters.premium = !this.filters.premium;
        this._updatePremiumUI();
        this._updateTrackDisplay();
    }

    /**
     * Set sort order
     * @public
     */
    setSortOrder(order) {
        this.sortOrder = order;
        this._updateTrackDisplay();
    }

    /**
     * Track download
     * @public
     */
    async trackDownload(trackId) {
        try {
            await dataManager.loadData('tracks/download', {
                trackId,
                profileId: profileManager.currentProfile?.id
            });
        } catch (error) {
            console.error('Failed to track download:', error);
        }
    }

    /**
     * Get available categories
     * @public
     */
    getCategories() {
        return Array.from(this.categories);
    }

    /**
     * Get track by ID
     * @public
     */
    getTrack(id) {
        return this.tracks.get(id);
    }

    /**
     * Refresh tracks data
     * @public
     */
    async refresh() {
        this.cache.lastUpdate = null;
        await this._loadTracks();
    }
}

// Export as singleton
export const tracksManager = new TracksManager();
