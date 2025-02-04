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
            lastRequestTime: null
        };
    }

    /**
     * Initialize the data manager and check API availability
     */
    async initialize() {
        try {
            // Check public API health
            const publicResponse = await this._makeRequest(`${this.PUBLIC_API_URL}/api/health`);
            this.isPublicApiAvailable = publicResponse.ok;
            console.log('Public API Status:', this.isPublicApiAvailable ? 'Available' : 'Unavailable');

            // Check internal API health for racing features
            try {
                const internalResponse = await this._makeRequest(`${this.INTERNAL_API_URL}/api/health`);
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

                if (response.ok) {
                    this.requestStats.successfulRequests++;
                } else {
                    this.requestStats.failedRequests++;
                }

                return response;
            } catch (error) {
                this.requestStats.failedRequests++;
                if (attempt === retries - 1) throw error;
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
            throw new Error(`API is not available (${useInternalApi ? 'Internal' : 'Public'})`);
        }

        try {
            // Build API URL with proper error handling for malformed input
            let url;
            try {
                url = this._buildApiUrl(apiUrl, type, options);
            } catch (error) {
                console.error('Error building API URL:', error);
                throw new Error('Invalid request parameters');
            }

            // Add racing-specific headers if needed
            const headers = {
                'Accept': 'application/json'
            };

            if (useInternalApi) {
                headers['X-Racing-Port'] = this._getRacingPort(options.raceId);
            }

            const response = await this._makeRequest(url, {
                credentials: useInternalApi ? 'include' : 'same-origin',
                headers
            });

            const data = await response.json();
            
            // Transform data based on type
            const transformedData = this._transformData(data, type);
            this.cache.set(cacheKey, transformedData);
            return transformedData;

        } catch (error) {
            console.error(`Failed to load ${type} data:`, error);
            throw error;
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
        if (!Array.isArray(data)) {
            data = [data];
        }

        switch (type) {
            case 'tracks':
            case 'mods':
                return data.map(item => ({
                    id: item.id,
                    name: item.title || `Unknown ${type.slice(0, -1)}`,
                    creator: item.creator || 'Unknown Creator',
                    description: item.description || '',
                    thumbnail: item.images?.cover || '/static/assets/images/placeholder.jpg',
                    additionalImages: item.images?.additional || [],
                    downloads: item.downloads?.download_count || 0,
                    downloadLinks: item.downloads?.by_type || { other: [] },
                    downloadHosts: item.downloads?.by_host || {},
                    url: this._validateUrl(item.url),
                    embeddedVideos: item.embedded_videos || [],
                    createdAt: item.created_at,
                    updatedAt: item.updated_at
                }));

            case 'races':
                return data.map(item => ({
                    id: item.id,
                    name: item.name,
                    status: item.status,
                    trackId: item.track_id,
                    format: item.format,
                    maxRiders: item.max_riders,
                    weather: item.weather,
                    qualifyingConfig: item.qualifying_config,
                    raceConfig: item.race_config,
                    createdAt: item.created_at,
                    startedAt: item.started_at,
                    endedAt: item.ended_at
                }));

            case 'race_instances':
                return data.map(item => ({
                    id: item.id,
                    raceId: item.race_id,
                    instanceId: item.instance_id,
                    type: item.type,
                    groupId: item.group_id,
                    port: item.port,
                    status: item.status,
                    createdAt: item.created_at,
                    startedAt: item.started_at,
                    endedAt: item.ended_at
                }));

            case 'race_results':
                return data.map(item => ({
                    id: item.id,
                    raceId: item.race_id,
                    instanceId: item.instance_id,
                    riderId: item.rider_id,
                    position: item.position,
                    lapTimes: item.lap_times,
                    bestLap: item.best_lap,
                    totalTime: item.total_time,
                    status: item.status,
                    createdAt: item.created_at
                }));

            case 'riders':
                return data.map(item => ({
                    id: item.id,
                    name: item.name,
                    discordId: item.discord_id,
                    steamId: item.steam_id,
                    rating: item.rating,
                    racesCompleted: item.races_completed,
                    wins: item.wins,
                    podiums: item.podiums,
                    createdAt: item.created_at,
                    lastRaceAt: item.last_race_at
                }));

            case 'ranking_history':
                return data.map(item => ({
                    id: item.id,
                    riderId: item.rider_id,
                    raceId: item.race_id,
                    oldRating: item.old_rating,
                    newRating: item.new_rating,
                    changeReason: item.change_reason,
                    createdAt: item.created_at
                }));

            default:
                return data;
        }
    }

    /**
     * Validate and clean URL
     * @private
     */
    _validateUrl(url) {
        if (!url) return null;

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
        return { ...this.requestStats };
    }
}

// Export as singleton
export const dataManager = new DataManager();
