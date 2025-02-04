/**
 * Data Manager for MXBikes.net
 * Handles static data loading with error handling and fallbacks
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.apiEndpoint = null;
        this.isApiAvailable = false;
    }

    /**
     * Initialize the data manager
     * @param {string} apiEndpoint Optional API endpoint for progressive enhancement
     */
    async initialize(apiEndpoint = null) {
        this.apiEndpoint = apiEndpoint;
        if (apiEndpoint) {
            try {
                const response = await fetch(`${apiEndpoint}/health`);
                this.isApiAvailable = response.ok;
            } catch (error) {
                console.warn('API not available, falling back to static data');
                this.isApiAvailable = false;
            }
        }
    }

    /**
     * Load data with fallback to static JSON
     * @param {string} type Data type to load (tracks, mods, rankings, etc.)
     * @returns {Promise<Object>} The loaded data
     */
    async loadData(type) {
        // Check cache first
        if (this.cache.has(type)) {
            return this.cache.get(type);
        }

        // Try API if available
        if (this.isApiAvailable) {
            try {
                const response = await fetch(`${this.apiEndpoint}/${type}`);
                if (response.ok) {
                    const data = await response.json();
                    this.cache.set(type, data);
                    return data;
                }
            } catch (error) {
                console.warn(`API fetch failed for ${type}, falling back to static data`);
            }
        }

        // Fallback to static JSON
        try {
            const response = await fetch(`/static/data/${type}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${type} data`);
            }
            const data = await response.json();
            this.cache.set(type, data);
            return data;
        } catch (error) {
            console.error(`Failed to load ${type} data:`, error);
            return this.getFallbackData(type);
        }
    }

    /**
     * Get fallback data for when both API and static JSON fail
     * @param {string} type Data type
     * @returns {Object} Fallback data structure
     */
    getFallbackData(type) {
        const fallbacks = {
            tracks: { tracks: [], lastUpdated: null },
            mods: { mods: [], lastUpdated: null },
            rankings: { rankings: [], recentRaces: [], lastUpdated: null }
        };
        return fallbacks[type] || { error: 'Data unavailable' };
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

    /**
     * Check if data needs refresh
     * @param {string} type Data type to check
     * @returns {boolean} True if data should be refreshed
     */
    shouldRefresh(type) {
        if (!this.cache.has(type)) return true;
        const data = this.cache.get(type);
        if (!data.lastUpdated) return true;
        
        const lastUpdate = new Date(data.lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
        
        // Refresh after 1 hour
        return hoursSinceUpdate > 1;
    }

    /**
     * Subscribe to data updates
     * @param {string} type Data type to watch
     * @param {Function} callback Callback function
     */
    subscribe(type, callback) {
        // Set up periodic checks for data freshness
        setInterval(async () => {
            if (this.shouldRefresh(type)) {
                try {
                    const data = await this.loadData(type);
                    callback(data);
                } catch (error) {
                    console.error(`Failed to refresh ${type} data:`, error);
                }
            }
        }, 60000); // Check every minute
    }
}

// Export as singleton
export const dataManager = new DataManager();
