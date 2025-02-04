/**
 * Ranked Manager for MXBikes.net
 * Handles top 10 rankings display and updates
 */

import { dataManager } from './data-manager.js';

class RankedManager {
    constructor() {
        this.rankings = new Map();
        this.lastUpdate = null;
        this.isLoading = false;
        this.error = null;

        // Initialize rankings
        this._initializeRankings();
        this._setupAutoRefresh();
    }

    /**
     * Initialize rankings system
     * @private
     */
    async _initializeRankings() {
        try {
            this._setLoading(true);
            await this._loadRankings();
            this._setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize rankings:', error);
            this._setError('Failed to load rankings. Please try again later.');
        } finally {
            this._setLoading(false);
        }
    }

    /**
     * Initialize home page rankings
     * @public
     */
    initializeHomeRankings(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.rankings.size === 0) {
            this._loadRankings().then(() => this._updateHomeRankings(container));
        } else {
            this._updateHomeRankings(container);
        }
    }

    /**
     * Update home page rankings
     * @private
     */
    _updateHomeRankings(container) {
        // Show top 3 on home page
        const topThree = Array.from(this.rankings.values()).slice(0, 3);
        
        container.innerHTML = `
            ${topThree.map(player => `
                <div class="home-player-card ${player.rank === 1 ? 'rank-one' : ''}">
                    <div class="rank-badge">#${player.rank}</div>
                    <div class="player-info">
                        <h3>${player.name}</h3>
                        <div class="player-stats">
                            <span>Elo: ${player.elo_rating}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
            <div class="rankings-promotion">
                <p>These riders earned their spot.</p>
                <p>Ready to challenge them?</p>
            </div>
        `;
    }

    /**
     * Set up auto-refresh for rankings
     * @private
     */
    _setupAutoRefresh() {
        // Refresh every 5 minutes
        setInterval(() => {
            this._loadRankings();
        }, 5 * 60 * 1000);
    }

    /**
     * Load rankings from JSON fallback or API
     * @private
     */
    async _loadRankings() {
        try {
            const response = await fetch('../static/data/ranked-fallback.json');
            const data = await response.json();
            
            this.rankings.clear();
            data.top_10.forEach(player => {
                this.rankings.set(player.rank, player);
            });
            
            this.lastUpdate = new Date(data.last_update);
            this.nextUpdate = new Date(data.next_update);
            this.totalPlayers = data.total_ranked_players;
            this.season = data.season;
            
            this._updateRankingsDisplay();
        } catch (error) {
            console.error('Failed to load rankings:', error);
            this._setError('Failed to load rankings. Please try again later.');
        }
    }

    /**
     * Update rankings display
     * @private
     */
    _updateRankingsDisplay() {
        const rankingsContainer = document.getElementById('rankingsContainer');
        if (!rankingsContainer) return;

        if (this.isLoading) {
            rankingsContainer.innerHTML = this._generateLoadingState();
            return;
        }

        if (this.error) {
            rankingsContainer.innerHTML = this._generateErrorState();
            return;
        }

        rankingsContainer.innerHTML = `
            <div class="rankings-header">
                <h2>Top 10 Rankings</h2>
                <div class="rankings-info">
                    <span>Total Players: ${this.totalPlayers}</span>
                    <span>Last Update: ${this._formatDate(this.lastUpdate)}</span>
                </div>
            </div>
            <div class="rankings-motivation">
                <p>The path to the top is open to everyone.</p>
                <p>These riders proved their skill - you could be next.</p>
            </div>
            <div class="rankings-list">
                ${Array.from(this.rankings.values())
                    .map(player => this._generatePlayerCard(player))
                    .join('')}
            </div>
            ${this._generateSeasonInfo()}
        `;
    }

    /**
     * Generate player card HTML
     * @private
     */
    _generatePlayerCard(player) {
        return `
            <div class="player-card ${player.rank === 1 ? 'rank-one' : ''}">
                <div class="rank-badge">#${player.rank}</div>
                <div class="player-info">
                    <h3>${player.name}</h3>
                    <div class="player-stats">
                        <span>Elo: ${player.elo_rating}</span>
                        <span>${player.races_completed} races</span>
                    </div>
                </div>
                <div class="last-race">
                    Last Race: ${this._formatDate(new Date(player.last_race))}
                </div>
            </div>
        `;
    }

    /**
     * Generate season info HTML
     * @private
     */
    _generateSeasonInfo() {
        if (!this.season) return '';

        return `
            <div class="season-info">
                <h3>${this.season.name}</h3>
                <div class="lan-qualification">
                    <h4>${this.season.lan_qualification.event}</h4>
                    <p>Top ranked riders qualify for playoffs</p>
                    <p>Every race is a chance to climb the rankings</p>
                </div>
            </div>
        `;
    }

    /**
     * Generate loading state HTML
     * @private
     */
    _generateLoadingState() {
        return `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading rankings...</p>
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
                <button onclick="rankedManager.refresh()">Try Again</button>
            </div>
        `;
    }

    /**
     * Format date for display
     * @private
     */
    _formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Set loading state
     * @private
     */
    _setLoading(loading) {
        this.isLoading = loading;
        this._updateRankingsDisplay();
    }

    /**
     * Set error state
     * @private
     */
    _setError(message) {
        this.error = message;
        this._updateRankingsDisplay();
    }

    /**
     * Refresh rankings
     * @public
     */
    refresh() {
        this._loadRankings();
    }
}

// Export as singleton
export const rankedManager = new RankedManager();
