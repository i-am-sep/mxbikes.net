/**
 * Downloads Manager for MXBikes.net
 * Handles downloads listings with JSON fallback and infinite scroll
 */

import { dataManager } from './data-manager.js';

class DownloadsManager {
    constructor() {
        this.downloads = new Map();
        this.filters = {
            search: '',
            category: 'all'
        };
        this.sortOrder = 'newest';
        
        // Pagination
        this.page = 1;
        this.isLoading = false;
        this.hasMoreData = true;
        this.usingJsonFallback = true;

        // Initialize downloads system
        this._initializeDownloads();
        this._setupScrollListener();
        this._setupSearchListener();
    }

    /**
     * Initialize downloads system
     * @private
     */
    async _initializeDownloads() {
        try {
            this._setLoading(true);
            await this._loadJsonDownloads();
            this._setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize downloads:', error);
            this._setError('Failed to load downloads. Please try again later.');
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
                    this._loadDbDownloads();
                } else {
                    this.page++;
                    this._loadDbDownloads();
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
        const searchInput = document.getElementById('downloadSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    // Switch to DB search immediately
                    this.usingJsonFallback = false;
                    this.page = 1;
                    this.filters.search = query;
                    this._loadDbDownloads();
                } else if (query.length === 0) {
                    // Reset to JSON fallback
                    this.usingJsonFallback = true;
                    this.filters.search = '';
                    this._loadJsonDownloads();
                }
            });
        }
    }

    /**
     * Load downloads from JSON fallback
     * @private
     */
    async _loadJsonDownloads() {
        try {
            const response = await fetch('../static/data/downloads-fallback.json');
            const data = await response.json();
            
            this.downloads.clear();
            data.downloads.forEach(download => {
                if (download && download.id) {
                    this.downloads.set(download.id, download);
                }
            });
            
            this._updateDownloadDisplay();
        } catch (error) {
            console.error('Failed to load JSON downloads:', error);
            this._setError('Failed to load downloads. Please try again later.');
        }
    }

    /**
     * Load downloads from database
     * @private
     */
    async _loadDbDownloads() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            const downloads = await dataManager.loadData('downloads', {
                page: this.page,
                search: this.filters.search,
                category: this.filters.category,
                sort: this.sortOrder
            });

            if (!Array.isArray(downloads) || downloads.length === 0) {
                this.hasMoreData = false;
                return;
            }

            downloads.forEach(download => {
                if (download && download.id) {
                    this.downloads.set(download.id, download);
                }
            });

            this._updateDownloadDisplay();
        } catch (error) {
            console.error('Failed to load DB downloads:', error);
            if (this.page === 1) {
                // Fallback to JSON if initial DB load fails
                this.usingJsonFallback = true;
                await this._loadJsonDownloads();
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Update download display
     * @private
     */
    _updateDownloadDisplay() {
        const downloadGrid = document.getElementById('downloadGrid');
        if (!downloadGrid) return;

        const downloads = Array.from(this.downloads.values());
        const sortedDownloads = this._sortDownloads(downloads);

        downloadGrid.innerHTML = sortedDownloads.map(download => this._generateDownloadCard(download)).join('');
    }

    /**
     * Sort downloads based on current sort order
     * @private
     */
    _sortDownloads(downloads) {
        switch (this.sortOrder) {
            case 'newest':
                return downloads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'popular':
                return downloads.sort((a, b) => b.downloads.count - a.downloads.count);
            default:
                return downloads;
        }
    }

    /**
     * Generate download card HTML
     * @private
     */
    _generateDownloadCard(download) {
        return `
            <div class="download-card">
                <img src="${download.thumbnail}" alt="${download.name}" class="download-thumbnail">
                <div class="download-info">
                    <h3>${download.name}</h3>
                    <p>${download.creator}</p>
                    <div class="download-stats">
                        <span>${download.downloads.count} downloads</span>
                        <span>Version: ${download.version}</span>
                    </div>
                    <div class="download-requirements">
                        <span>OS: ${download.requirements.os}</span>
                        <span>RAM: ${download.requirements.ram}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set loading state
     * @private
     */
    _setLoading(loading) {
        this.isLoading = loading;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = loading ? 'block' : 'none';
        }
    }

    /**
     * Set error state
     * @private
     */
    _setError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = message ? 'block' : 'none';
        }
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for cache invalidation events
        dataManager.subscribeToEvent('downloads_updated', () => {
            this.usingJsonFallback = true;
            this._loadJsonDownloads();
        });

        // Listen for network status changes
        window.addEventListener('online', () => {
            this._loadJsonDownloads();
        });
    }
}

// Export as singleton
export const downloadsManager = new DownloadsManager();
