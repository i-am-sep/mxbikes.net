/**
 * Data Manager for MXBikes.net
 * Handles API data loading with error handling and racing integration
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        // Production API for public content
        this.PUBLIC_API_URL = 'https://mxbikes.app';
        // Development/Internal API for racing features
        this.INTERNAL_API_URL = 'https://mxbikes.xyz';
        this.isPublicApiAvailable = false;
        this.isInternalApiAvailable = false;
    }

    /**
     * Initialize the data manager and check API availability
     */
    async initialize() {
        try {
            // Check public API health
            const publicResponse = await fetch(`${this.PUBLIC_API_URL}/api/health`);
            this.isPublicApiAvailable = publicResponse.ok;
            console.log('Public API Status:', this.isPublicApiAvailable ? 'Available' : 'Unavailable');

            // Check internal API health for racing features
            try {
                const internalResponse = await fetch(`${this.INTERNAL_API_URL}/api/health`);
                this.isInternalApiAvailable = internalResponse.ok;
                console.log('Internal API Status:', this.isInternalApiAvailable ? 'Available' : 'Unavailable');
            } catch (error) {
                console.warn('Internal API not available:', error);
                this.isInternalApiAvailable = false;
            }
        } catch (error) {
            console.warn('Public API not available:', error);
            this.isPublicApiAvailable = false;
        }
    }

    /**
     * Load data from appropriate API
     * @param {string} type Data type to load (tracks, downloads, races, etc.)
     * @param {Object} options Optional parameters (search, filters, etc.)
     * @returns {Promise<Object>} The loaded data
     */
    async loadData(type, options = {}) {
        // Check cache first
        const cacheKey = this._getCacheKey(type, options);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Determine which API to use based on type
        const useInternalApi = type.startsWith('race') || type === 'rankings';
        const apiUrl = useInternalApi ? this.INTERNAL_API_URL : this.PUBLIC_API_URL;
        const isAvailable = useInternalApi ? this.isInternalApiAvailable : this.isPublicApiAvailable;

        if (!isAvailable) {
            throw new Error(`API is not available (${useInternalApi ? 'Internal' : 'Public'})`);
        }

        try {
            // Build API URL
            let url = `${apiUrl}/api/${type}`;
            url = this._appendQueryParams(url, options);

            // Make API request
            const response = await fetch(url, {
                credentials: useInternalApi ? 'include' : 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache the results
            this.cache.set(cacheKey, data);
            return data;

        } catch (error) {
            console.error(`Failed to load ${type} data:`, error);
            throw error;
        }
    }

    /**
     * Generate cache key from type and options
     * @private
     */
    _getCacheKey(type, options) {
        return `${type}-${JSON.stringify(options)}`;
    }

    /**
     * Append query parameters to URL
     * @private
     */
    _appendQueryParams(url, options) {
        const params = new URLSearchParams();

        if (options.search) {
            params.append('q', options.search);
        }

        if (options.category && options.category !== 'all') {
            params.append('category', options.category);
        }

        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
    }

    /**
     * Clear cached data
     * @param {string} type Optional specific type to clear
     */
    clearCache(type = null) {
        if (type) {
            // Clear all cache entries for the specified type
            for (const key of this.cache.keys()) {
                if (key.startsWith(type)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Check if racing features are available
     * @returns {boolean}
     */
    hasRacingAccess() {
        return this.isInternalApiAvailable;
    }
}

// Export as singleton
export const dataManager = new DataManager();
