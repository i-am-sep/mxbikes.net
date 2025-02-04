/**
 * Data Manager for MXBikes.net
 * Handles data loading with JSON fallback and API integration
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.useApi = true; // Enable API usage by default
        this.apiEndpoint = 'http://68.183.8.177:3000/api'; // Amsterdam API endpoint
        this.apiHealthy = false;
        
        // Request tracking
        this.requestStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastRequestTime: null,
            errors: new Map()
        };

        // Error types
        this.ERROR_TYPES = {
            NETWORK: 'NETWORK_ERROR',
            PARSE: 'PARSE_ERROR',
            VALIDATION: 'VALIDATION_ERROR',
            API: 'API_ERROR'
        };

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the data manager
     */
    async initialize() {
        // Check API health
        try {
            const healthCheck = await fetch(`${this.apiEndpoint}/health`);
            if (healthCheck.ok) {
                const health = await healthCheck.json();
                this.apiHealthy = health.status === 'ok';
                console.log(`API Status: ${this.apiHealthy ? 'Healthy' : 'Unhealthy'} (${health.region})`);
            } else {
                this.apiHealthy = false;
                console.warn('API health check failed, falling back to JSON');
            }
        } catch (error) {
            this.apiHealthy = false;
            console.warn('API not available, falling back to JSON:', error);
        }

        // Load initial data into cache
        await this._loadInitialData();

        // Set up periodic health checks
        setInterval(() => this._checkApiHealth(), 30000); // Check every 30 seconds
    }

    /**
     * Check API health periodically
     * @private
     */
    async _checkApiHealth() {
        try {
            const response = await fetch(`${this.apiEndpoint}/health`);
            const wasHealthy = this.apiHealthy;
            this.apiHealthy = response.ok;
            
            if (wasHealthy !== this.apiHealthy) {
                console.log(`API Status Changed: ${this.apiHealthy ? 'Healthy' : 'Unhealthy'}`);
                if (this.apiHealthy) {
                    await this._loadInitialData(); // Refresh data when API comes back
                }
            }
        } catch (error) {
            this.apiHealthy = false;
        }
    }

    /**
     * Load initial data from API or JSON files
     * @private
     */
    async _loadInitialData() {
        try {
            if (this.apiHealthy) {
                // Try loading from API first
                try {
                    const [tracks, downloads, races, rankings] = await Promise.allSettled([
                        fetch(`${this.apiEndpoint}/tracks`).then(r => r.json()),
                        fetch(`${this.apiEndpoint}/downloads`).then(r => r.json()),
                        fetch(`${this.apiEndpoint}/races/upcoming`).then(r => r.json()),
                        fetch(`${this.apiEndpoint}/ranked/top10`).then(r => r.json())
                    ]);

                    // Store successful API responses
                    if (tracks.status === 'fulfilled') this.cache.set('tracks', tracks.value);
                    if (downloads.status === 'fulfilled') this.cache.set('downloads', downloads.value);
                    if (races.status === 'fulfilled') this.cache.set('races', races.value);
                    if (rankings.status === 'fulfilled') this.cache.set('rankings', rankings.value);

                    // Fall back to JSON for any failed requests
                    if (tracks.status === 'rejected') await this._loadJsonFallback('tracks');
                    if (downloads.status === 'rejected') await this._loadJsonFallback('downloads');
                    if (races.status === 'rejected') await this._loadJsonFallback('races');
                    if (rankings.status === 'rejected') await this._loadJsonFallback('rankings');

                    return;
                } catch (error) {
                    console.warn('API data loading failed, falling back to JSON:', error);
                    this.apiHealthy = false;
                }
            }

            // Load from JSON fallbacks if API is unhealthy or failed
            await Promise.all([
                this._loadJsonFallback('tracks'),
                this._loadJsonFallback('downloads'),
                this._loadJsonFallback('races'),
                this._loadJsonFallback('rankings')
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this._trackError(this.ERROR_TYPES.NETWORK, error);
        }
    }

    /**
     * Load JSON fallback data
     * @private
     */
    async _loadJsonFallback(type) {
        try {
            const response = await fetch(`../static/data/${type}-fallback.json`);
            const data = await response.json();
            this.cache.set(type, data);
        } catch (error) {
            console.warn(`${type} fallback data not available:`, error);
        }
    }

    /**
     * Load data with search and filter support
     * @param {string} type Data type to load (tracks, downloads, races, etc.)
     * @param {Object} options Optional parameters (search, filters, etc.)
     * @returns {Promise<Object>} The loaded data
     */
    async loadData(type, options = {}) {
        // Input validation
        if (!type || typeof type !== 'string') {
            throw new Error('Invalid data type requested');
        }

        try {
            if (this.apiHealthy) {
                // Try loading from API with search/filter params
                try {
                    const queryParams = new URLSearchParams();
                    if (options.search) queryParams.set('search', options.search);
                    if (options.category) queryParams.set('category', options.category);

                    const response = await fetch(`${this.apiEndpoint}/${type}?${queryParams}`);
                    if (!response.ok) throw new Error(`API error: ${response.status}`);
                    
                    const data = await response.json();
                    this.cache.set(type, data);
                    this.requestStats.successfulRequests++;
                    return this._filterData(data, type, options);
                } catch (error) {
                    console.warn('API request failed, using cached data:', error);
                    this._trackError(this.ERROR_TYPES.API, error);
                }
            }

            // Get data from cache
            const cachedData = this.cache.get(type);
            if (!cachedData) {
                throw new Error(`No data available for type: ${type}`);
            }

            // Apply search and filters
            return this._filterData(cachedData, type, options);
        } catch (error) {
            console.error(`Failed to load ${type} data:`, error);
            throw new Error(`Failed to load ${type}. Please try again later.`);
        }
    }

    /**
     * Filter data based on search and options
     * @private
     */
    _filterData(data, type, options) {
        let items = [];

        switch (type) {
            case 'tracks':
                items = data.tracks || [];
                break;
            case 'downloads':
                items = data.downloads || [];
                break;
            case 'races':
                items = data.races || [];
                break;
            case 'rankings':
                items = data.top_10 || [];
                break;
            default:
                items = Array.isArray(data) ? data : [];
        }

        // Apply search
        if (options.search) {
            const searchLower = options.search.toLowerCase();
            items = items.filter(item => 
                item.name?.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower) ||
                item.creator?.toLowerCase().includes(searchLower)
            );
        }

        // Apply category filter
        if (options.category && options.category !== 'all') {
            items = items.filter(item => 
                item.category?.toLowerCase() === options.category.toLowerCase()
            );
        }

        return items;
    }

    /**
     * Track error occurrence
     * @private
     */
    _trackError(type, error) {
        const count = this.requestStats.errors.get(type) || 0;
        this.requestStats.errors.set(type, count + 1);
        this.requestStats.failedRequests++;
        this.requestStats.lastRequestTime = new Date();
        console.error(`[${type}] Error:`, error);
    }

    /**
     * Clear cached data
     * @param {string} type Optional specific type to clear
     */
    clearCache(type = null) {
        if (type) {
            this.cache.delete(type);
        } else {
            this.cache.clear();
        }
        this._loadInitialData();
    }

    /**
     * Get request statistics
     * @returns {Object} Current request statistics
     */
    getRequestStats() {
        return {
            ...this.requestStats,
            errors: Object.fromEntries(this.requestStats.errors),
            apiStatus: this.apiHealthy ? 'healthy' : 'unhealthy',
            lastCheck: this.requestStats.lastRequestTime
        };
    }
}

// Export as singleton
export const dataManager = new DataManager();
