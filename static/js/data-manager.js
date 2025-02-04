/**
 * Data Manager for MXBikes.net
 * Handles API data loading with error handling and caching
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        // Production API for public endpoints
        this.PUBLIC_API_URL = 'https://api.mxbikes.app';
        // Development/Internal API for subscription features
        this.INTERNAL_API_URL = 'https://api.mxbikes.xyz';
        this.isPublicApiAvailable = false;
        this.isInternalApiAvailable = false;
        this.hasSubscription = false; // Will be set during initialization
    }

    /**
     * Initialize the data manager and check API availability
     */
    async initialize() {
        try {
            // Check public API health
            const publicResponse = await fetch(`${this.PUBLIC_API_URL}/health`);
            this.isPublicApiAvailable = publicResponse.ok;

            // Check internal API health and subscription status
            try {
                const internalResponse = await fetch(`${this.INTERNAL_API_URL}/auth/status`, {
                    credentials: 'include' // Send cookies for auth
                });
                if (internalResponse.ok) {
                    const status = await internalResponse.json();
                    this.isInternalApiAvailable = true;
                    this.hasSubscription = status.hasSubscription;
                }
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
     * Load data from appropriate API based on type and subscription status
     * @param {string} type Data type to load (tracks, downloads, etc.)
     * @param {Object} options Optional parameters (search, filters, etc.)
     * @returns {Promise<Object>} The loaded data
     */
    async loadData(type, options = {}) {
        // Determine which API to use based on type and subscription
        const useInternalApi = this.hasSubscription && 
                             this.isInternalApiAvailable && 
                             options.premium;

        const apiUrl = useInternalApi ? this.INTERNAL_API_URL : this.PUBLIC_API_URL;
        const isAvailable = useInternalApi ? this.isInternalApiAvailable : this.isPublicApiAvailable;

        if (!isAvailable) {
            throw new Error(`API is not available (${useInternalApi ? 'Internal' : 'Public'})`);
        }

        let url = `${apiUrl}/${type}`;

        // Add search parameters if provided
        if (options.search) {
            url += `/search?q=${encodeURIComponent(options.search)}`;
        }

        // Add category filter if provided
        if (options.category && options.category !== 'all') {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}category=${encodeURIComponent(options.category)}`;
        }

        // Add premium flag for internal API
        if (useInternalApi) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}premium=true`;
        }

        try {
            const response = await fetch(url, {
                credentials: useInternalApi ? 'include' : 'same-origin' // Include cookies for internal API
            });
            
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

    /**
     * Check if user has access to premium features
     * @returns {boolean}
     */
    hasPremiumAccess() {
        return this.hasSubscription && this.isInternalApiAvailable;
    }
}

// Export as singleton
export const dataManager = new DataManager();
