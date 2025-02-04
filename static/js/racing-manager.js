/**
 * Racing Manager for MXBikes.net
 * Handles race listings, entries, and live updates
 */

import { dataManager } from './data-manager.js';

class RacingManager {
    constructor() {
        this.races = new Map();
        this.filters = {
            timeFrame: 3 // hours
        };
        
        // Loading states
        this.isLoading = false;
        this.error = null;

        // Initialize racing system
        this._initializeRacing();
    }

    /**
     * Initialize racing system
     * @private
     */
    async _initializeRacing() {
        try {
            this._setLoading(true);
            await this._loadUpcomingRaces();
            this._setupEventListeners();
            this._startAutoRefresh();
        } catch (error) {
            console.error('Failed to initialize racing:', error);
            this._setError('Failed to load races. Please try again later.');
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Load upcoming races from JSON fallback
     * @private
     */
    async _loadUpcomingRaces() {
        try {
            const response = await fetch('../static/data/races-fallback.json');
            const data = await response.json();
            
            this.races.clear();
            data.races.forEach(race => {
                if (this._isUpcoming(race)) {
                    this.races.set(race.id, race);
                }
            });
            
            this._updateRaceDisplay();
        } catch (error) {
            console.error('Failed to load JSON races:', error);
            this._setError('Failed to load races. Please try again later.');
        }
    }

    /**
     * Check if race is within timeframe
     * @private
     */
    _isUpcoming(race) {
        const raceTime = new Date(race.start_time);
        const now = new Date();
        const hoursDiff = (raceTime - now) / (1000 * 60 * 60);
        return hoursDiff >= 0 && hoursDiff <= this.filters.timeFrame;
    }

    /**
     * Start auto-refresh for race data
     * @private
     */
    _startAutoRefresh() {
        setInterval(() => {
            this._loadUpcomingRaces();
        }, 60000); // Refresh every minute
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for profile updates
        document.addEventListener('profileUpdated', () => {
            this._updateRaceDisplay();
        });

        // Listen for network status changes
        window.addEventListener('online', () => {
            this._loadUpcomingRaces();
        });
    }

    /**
     * Update race display
     * @private
     */
    _updateRaceDisplay() {
        const raceList = document.getElementById('raceList');
        if (!raceList) return;

        if (this.isLoading) {
            raceList.innerHTML = this._generateLoadingState();
            return;
        }

        if (this.error) {
            raceList.innerHTML = this._generateErrorState();
            return;
        }

        const races = Array.from(this.races.values());
        if (races.length === 0) {
            raceList.innerHTML = this._generateEmptyState();
            return;
        }

        raceList.innerHTML = races
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
            .map(race => this._generateRaceCard(race))
            .join('');
    }

    /**
     * Generate race card HTML
     * @private
     */
    _generateRaceCard(race) {
        const startTime = new Date(race.start_time);
        const timeUntil = this._formatTimeUntil(startTime);
        const trackInfo = this._generateTrackInfo(race.track);

        return `
            <div class="race-card" onclick="window.location.href='/racing/race/${race.id}'">
                <div class="race-header">
                    <h3>${race.name}</h3>
                    <span class="race-time">${timeUntil}</span>
                </div>
                <div class="race-info">
                    <div class="race-classes">
                        ${race.classes.map(c => `
                            <div class="race-class">
                                <span>${c.name}</span>
                                <span>${c.entries}/${c.max_entries} entries</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="race-details">
                        <div class="prize-pool">Prize Pool: $${race.prize_pool}</div>
                        <div class="entry-fee">Entry Fee: $${race.entry_fee}</div>
                    </div>
                    ${trackInfo}
                    <div class="race-teams">
                        <h4>Teams (${race.teams.length})</h4>
                        ${race.teams.map(team => `
                            <div class="team-entry">
                                <span>${team.name}</span>
                                <span>${team.brand}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="race-footer">
                    <a href="${race.discord_link}" target="_blank" class="discord-link">
                        Join Discord
                    </a>
                    ${race.status === 'open' ? 
                        '<button class="signup-btn">Sign Up</button>' : 
                        '<span class="status-closed">Entries Closed</span>'}
                </div>
            </div>
        `;
    }

    /**
     * Generate track info HTML
     * @private
     */
    _generateTrackInfo(track) {
        return `
            <div class="track-info">
                <h4>${track.name}</h4>
                ${track.type === 'premium' ?
                    `<a href="${track.purchase_url}" target="_blank" class="track-purchase">
                        Purchase Track
                    </a>` :
                    `<a href="${track.download_url}" class="track-download">
                        Download Track
                    </a>`
                }
            </div>
        `;
    }

    /**
     * Format time until race
     * @private
     */
    _formatTimeUntil(date) {
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `Starts in ${hours}h ${minutes}m`;
        }
        return `Starts in ${minutes}m`;
    }

    /**
     * Generate loading state HTML
     * @private
     */
    _generateLoadingState() {
        return `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading races...</p>
            </div>
        `;
    }

    /**
     * Generate error state HTML
     * @private
     */
    _generateErrorState() {
        return `
            <div class="error-state">
                <p>${this.error}</p>
                <button onclick="racingManager.refresh()">Try Again</button>
            </div>
        `;
    }

    /**
     * Generate empty state HTML
     * @private
     */
    _generateEmptyState() {
        return `
            <div class="empty-state">
                <p>No upcoming races in the next ${this.filters.timeFrame} hours</p>
            </div>
        `;
    }

    /**
     * Set loading state
     * @private
     */
    _setLoading(loading) {
        this.isLoading = loading;
        this._updateRaceDisplay();
    }

    /**
     * Set error state
     * @private
     */
    _setError(message) {
        this.error = message;
        this._updateRaceDisplay();
    }

    /**
     * Refresh races
     * @public
     */
    refresh() {
        this._loadUpcomingRaces();
    }
}

// Export as singleton
export const racingManager = new RacingManager();
