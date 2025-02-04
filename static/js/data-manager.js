/**
 * Data Manager for MXBikes.net
 * Handles API data loading with error handling, racing integration, and security
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

        // Port configurations for racing
        this.RACING_PORTS = {
            GAME_INSTANCES: { start: 54201, end: 54209 },
            LIVE_INTERACTION: 54220,
            ADMIN_COMMANDS: 54230
        };

        // Rate limiting configuration
        this.rateLimits = {
            maxRequestsPerSecond: 10,
            burstLimit: 20,
            requestHistory: [],
            lastReset: Date.now()
        };

        // Request tracking
        this.requestStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastRequestTime: null,
            errors: new Map() // Track error types
        };

        // Error types
        this.ERROR_TYPES = {
            NETWORK: 'NETWORK_ERROR',
            API: 'API_ERROR',
            PARSE: 'PARSE_ERROR',
            VALIDATION: 'VALIDATION_ERROR'
        };
    }

    /**
     * Initialize the data manager and check API availability
     */
    async initialize() {
        try {
            // Check public API health with timeout
            const publicHealth = await Promise.race([
                this._makeRequest(`${this.PUBLIC_API_URL}/api/health`),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);

            if (publicHealth.ok) {
                const healthData = await publicHealth.json();
                this.isPublicApiAvailable = healthData.status === 'ok';
            }
        } catch (error) {
            console.warn('Public API health check failed:', error);
            this.isPublicApiAvailable = false;
            this._trackError(this.ERROR_TYPES.NETWORK, error);
        }

        try {
            // Check internal API health with timeout
            const internalHealth = await Promise.race([
                this._makeRequest(`${this.INTERNAL_API_URL}/api/health`),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);

            if (internalHealth.ok) {
                const healthData = await internalHealth.json();
                this.isInternalApiAvailable = healthData.status === 'ok';
            }
        } catch (error) {
            console.warn('Internal API health check failed:', error);
            this.isInternalApiAvailable = false;
            this._trackError(this.ERROR_TYPES.NETWORK, error);
        }

        // If both APIs are unavailable, throw error
        if (!this.isPublicApiAvailable && !this.isInternalApiAvailable) {
            throw new Error('All APIs are currently unavailable. Please try again later.');
        }
    }

    /**
     * Track error occurrence
     * @private
     */
    _trackError(type, error) {
        const count = this.requestStats.errors.get(type) || 0;
        this.requestStats.errors.set(type, count + 1);
        
        // Log detailed error information
        console.error(`[${type}] Error:`, {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Make a rate-limited request with retry logic
     * @private
     */
    async _makeRequest(url, options = {}, retries = 3) {
        if (!this._checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        this.requestStats.totalRequests++;
        this.requestStats.lastRequestTime = Date.now();

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'X-Client-Version': '1.0.0',
                        'X-Request-ID': this._generateRequestId()
                    }
                });

                if (response.status === 429) { // Too Many Requests
                    const retryAfter = parseInt(response.headers.get('Retry-After')) || Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue;
                }

                // Handle specific error status codes
                if (!response.ok) {
                    this.requestStats.failedRequests++;
                    
                    // Try to get error details from response
                    let errorDetails = 'Unknown error';
                    try {
                        const errorData = await response.json();
                        errorDetails = errorData.message || errorData.error || errorDetails;
                    } catch {
                        // If can't parse error JSON, use status text
                        errorDetails = response.statusText;
                    }

                    throw new Error(`API Error (${response.status}): ${errorDetails}`);
                }

                this.requestStats.successfulRequests++;
                return response;
            } catch (error) {
                this.requestStats.failedRequests++;
                
                // Track error type
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    this._trackError(this.ERROR_TYPES.NETWORK, error);
                } else {
                    this._trackError(this.ERROR_TYPES.API, error);
                }

                if (attempt === retries - 1) throw error;
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    /**
     * Check if request is within rate limits
     * @private
     */
    _checkRateLimit() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;

        // Reset if last reset was more than a second ago
        if (now - this.rateLimits.lastReset > 1000) {
            this.rateLimits.requestHistory = [];
            this.rateLimits.lastReset = now;
        }

        // Remove requests older than 1 second
        this.rateLimits.requestHistory = this.rateLimits.requestHistory.filter(
            time => time > oneSecondAgo
        );

        // Check limits
        if (this.rateLimits.requestHistory.length >= this.rateLimits.burstLimit) {
            return false;
        }

        // Add current request
        this.rateLimits.requestHistory.push(now);
        return true;
    }

    /**
     * Generate unique request ID
     * @private
     */
    _generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Load data from appropriate API
     * @param {string} type Data type to load (tracks, mods, races, etc.)
     * @param {Object} options Optional parameters (search, filters, etc.)
     * @returns {Promise<Object>} The loaded data
     */
    async loadData(type, options = {}) {
        // Input validation
        if (!type || typeof type !== 'string') {
            throw new Error('Invalid data type requested');
        }

        // Check cache first
        const cacheKey = this._getCacheKey(type, options);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Determine which API to use based on type
        const useInternalApi = this._isInternalApiType(type);
        const apiUrl = useInternalApi ? this.INTERNAL_API_URL : this.PUBLIC_API_URL;
        const isAvailable = useInternalApi ? this.isInternalApiAvailable : this.isPublicApiAvailable;

        if (!isAvailable) {
            const apiType = useInternalApi ? 'Internal' : 'Public';
            throw new Error(`${apiType} API is currently unavailable. Please try again later.`);
        }

        try {
            // Build API URL with proper error handling for malformed input
            let url;
            try {
                url = this._buildApiUrl(apiUrl, type, options);
            } catch (error) {
                this._trackError(this.ERROR_TYPES.VALIDATION, error);
                throw new Error(`Invalid request parameters: ${error.message}`);
            }

            // Add headers
            const headers = {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate'
            };

            if (useInternalApi) {
                headers['X-Racing-Port'] = this._getRacingPort(options.raceId);
            }

            // Make request
            const response = await this._makeRequest(url, {
                credentials: useInternalApi ? 'include' : 'same-origin',
                headers
            });

            // Parse response
            let data;
            try {
                data = await response.json();
            } catch (error) {
                this._trackError(this.ERROR_TYPES.PARSE, error);
                throw new Error('Failed to parse API response');
            }

            // Validate response data
            if (!data) {
                throw new Error('Empty response received from API');
            }

            // Transform data based on type
            try {
                const transformedData = this._transformData(data, type);
                this.cache.set(cacheKey, transformedData);
                return transformedData;
            } catch (error) {
                this._trackError(this.ERROR_TYPES.VALIDATION, error);
                throw new Error(`Failed to process ${type} data: ${error.message}`);
            }
        } catch (error) {
            // Log the complete error
            console.error(`Failed to load ${type} data:`, {
                error,
                type,
                options,
                timestamp: new Date().toISOString()
            });

            // Throw a user-friendly error
            throw new Error(`Failed to load ${type}. Please try again later.`);
        }
    }

    /**
     * Check if data type requires internal API
     * @private
     */
    _isInternalApiType(type) {
        return [
            'races',
            'race_instances',
            'race_results',
            'riders',
            'rankings',
            'ranking_history'
        ].includes(type);
    }

    /**
     * Get appropriate racing port based on race ID
     * @private
     */
    _getRacingPort(raceId) {
        if (!raceId) return this.RACING_PORTS.LIVE_INTERACTION;
        
        // For specific races, calculate port from ID to ensure consistent allocation
        const portIndex = parseInt(raceId) % (this.RACING_PORTS.GAME_INSTANCES.end - this.RACING_PORTS.GAME_INSTANCES.start + 1);
        return this.RACING_PORTS.GAME_INSTANCES.start + portIndex;
    }

    /**
     * Transform API data to match frontend needs
     * @private
     */
    _transformData(data, type) {
        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [data];

        // Validate data array
        if (!dataArray.length) {
            return [];
        }

        try {
            switch (type) {
                case 'tracks':
                case 'mods':
                    return dataArray.map(item => {
                        if (!item) return null;
                        
                        return {
                            id: item.id || null,
                            name: item.title || item.name || `Unknown ${type.slice(0, -1)}`,
                            creator: item.creator || 'Unknown Creator',
                            description: item.description || '',
                            thumbnail: item.images?.cover || item.thumbnail || '/static/assets/images/placeholder.jpg',
                            additionalImages: item.images?.additional || item.additionalImages || [],
                            downloads: {
                                count: item.downloads?.download_count || item.downloads || 0,
                                links: this._processDownloadLinks(item.downloads?.by_type || item.downloadLinks),
                                hosts: item.downloads?.by_host || item.downloadHosts || {}
                            },
                            url: this._validateUrl(item.url),
                            embeddedVideos: item.embedded_videos || item.embeddedVideos || [],
                            createdAt: item.created_at || item.createdAt,
                            updatedAt: item.updated_at || item.updatedAt
                        };
                    }).filter(item => item !== null); // Remove any invalid items

                // ... [Other type transformations remain unchanged] ...

                default:
                    return dataArray;
            }
        } catch (error) {
            this._trackError(this.ERROR_TYPES.VALIDATION, error);
            throw new Error(`Data transformation failed: ${error.message}`);
        }
    }

    /**
     * Process download links
     * @private
     */
    _processDownloadLinks(links) {
        if (!links || typeof links !== 'object') {
            return { primary: null, mirrors: [] };
        }

        try {
            const allLinks = Array.isArray(links) ? links : Object.values(links).flat();
            const validLinks = allLinks.filter(link => this._validateUrl(link));

            return {
                primary: validLinks[0] || null,
                mirrors: validLinks.slice(1)
            };
        } catch (error) {
            console.warn('Failed to process download links:', error);
            return { primary: null, mirrors: [] };
        }
    }

    /**
     * Validate and clean URL
     * @private
     */
    _validateUrl(url) {
        if (!url || typeof url !== 'string') return null;

        // Known download hosts
        const validHosts = [
            'mediafire.com',
            'drive.google.com',
            'mega.nz',
            '1drv.ms'
        ];

        try {
            const urlObj = new URL(url);
            const isValidHost = validHosts.some(host => urlObj.hostname.includes(host));
            return isValidHost ? url : null;
        } catch {
            return null;
        }
    }

    /**
     * Build API URL with validation
     * @private
     */
    _buildApiUrl(baseUrl, type, options) {
        if (!type || typeof type !== 'string') {
            throw new Error('Invalid type parameter');
        }

        let url = `${baseUrl}/api/${type}`;
        url = this._appendQueryParams(url, options);

        try {
            new URL(url);
            return url;
        } catch (error) {
            throw new Error('Invalid URL construction');
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

    /**
     * Get request statistics
     * @returns {Object} Current request statistics
     */
    getRequestStats() {
        return {
            ...this.requestStats,
            errors: Object.fromEntries(this.requestStats.errors)
        };
    }

    /**
     * Get error counts by type
     * @returns {Object} Error counts
     */
    getErrorStats() {
        return Object.fromEntries(this.requestStats.errors);
    }
}

// Export as singleton
export const dataManager = new DataManager();
