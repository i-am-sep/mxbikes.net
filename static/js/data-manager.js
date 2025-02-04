/**
 * Data Manager for MXBikes.net
 * Handles API data loading with error handling and caching
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.API_URL = 'http://localhost:3000/api';
        this.isApiAvailable = false;
    }

    /**
     * Initialize the data manager and check API availability
     */
    async initialize() {
        try {
            const response = await fetch(`${this.API_URL}/health`);
            this.isApiAvailable = response.ok;
        } catch (error) {
            console.warn('API not available:', error);
            this.isApiAvailable = false;
        }
    }

    /**
     * Load data from API
     * @param {string} type Data type to load (tracks, downloads, etc.)
     * @param {Object} options Optional parameters (search, filters, etc.)
     * @returns {Promise<Object>} The loaded data
     */
    async loadData(type, options = {}) {
        if (!this.isApiAvailable) {
            throw new Error('API is not available');
        }

        let url = `${this.API_URL}/${type}`;

        // Add search parameters if provided
        if (options.search) {
            url += `/search?q=${encodeURIComponent(options.search)}`;
        }

        // Add category filter if provided
        if (options.category && options.category !== 'all') {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}category=${encodeURIComponent(options.category)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Failed to load ${type} data:`, error);
            throw error;
        }
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
    }
}

// Export as singleton
export const dataManager = new DataManager();
