/**
 * Ranked System Manager for MXBikes.net
 * Handles ranked racing, Discord integration, and live timing
 */

import { dataManager } from './data-manager.js';
import { profileManager } from './profile-manager.js';

class RankedManager {
    constructor() {
        this.currentRace = null;
        this.liveResults = new Map();
        
        // Live timing configuration
        this.liveTimingConfig = {
            updateInterval: 1000, // 1 second
            retryInterval: 5000,  // 5 seconds
            maxRetries: 3
        };

        // Initialize systems
        this._initializeWebSocket();
        this._initializeEventHandlers();
    }

    /**
     * Initialize WebSocket connection for live updates
     * @private
     */
    _initializeWebSocket() {
        // Subscribe to race events
        dataManager.subscribeToEvent('race_update', (data) => this._handleRaceUpdate(data));
        dataManager.subscribeToEvent('race_result', (data) => this._handleRaceResult(data));
        dataManager.subscribeToEvent('rider_update', (data) => this._handleRiderUpdate(data));
    }

    /**
     * Initialize event handlers
     * @private
     */
    _initializeEventHandlers() {
        // Handle race manager status changes
        document.addEventListener('raceManagerStatusChanged', (event) => {
            if (event.detail.isManager) {
                this._initializeManagerControls();
            }
        });

        // Handle profile changes
        document.addEventListener('profileUpdated', () => {
            this._updateRaceDisplay();
        });
    }

    /**
     * Handle race updates from WebSocket
     * @private
     */
    _handleRaceUpdate(data) {
        this.currentRace = data;
        this._updateRaceDisplay();
        this._notifyDiscord('race_update', data);
    }

    /**
     * Handle race results from WebSocket
     * @private
     */
    _handleRaceResult(data) {
        this.liveResults.set(data.riderId, data);
        this._updateResultsDisplay();
        this._notifyDiscord('race_result', data);
    }

    /**
     * Handle rider updates from WebSocket
     * @private
     */
    _handleRiderUpdate(data) {
        this._updateRiderDisplay(data);
        this._notifyDiscord('rider_update', data);
    }

    /**
     * Update race display with current information
     * @private
     */
    _updateRaceDisplay() {
        const raceDisplay = document.getElementById('currentRace');
        if (!raceDisplay || !this.currentRace) return;

        const canJoin = this._canJoinRace();
        const isManager = profileManager.raceManagerStatus;

        raceDisplay.innerHTML = `
            <div class="race-header">
                <h2 class="text-2xl font-bold">${this.currentRace.name}</h2>
                <span class="status-badge ${this.currentRace.status.toLowerCase()}">
                    ${this.currentRace.status}
                </span>
            </div>
            <div class="race-details">
                <p>Track: ${this.currentRace.trackName}</p>
                <p>Riders: ${this.currentRace.currentRiders}/${this.currentRace.maxRiders}</p>
                <p>Format: ${this.currentRace.format}</p>
                ${this._generateAccessInfo()}
            </div>
            ${canJoin ? this._generateJoinButton() : this._generateJoinRequirements()}
            ${isManager ? this._generateManagerControls() : ''}
        `;
    }

    /**
     * Generate access information HTML
     * @private
     */
    _generateAccessInfo() {
        const profile = profileManager.currentProfile;
        if (!profile) return '';

        const isWhitelisted = profileManager.isWhitelisted(this.currentRace.id);
        const isBlacklisted = profileManager.isBlacklisted(this.currentRace.id);

        if (isBlacklisted) {
            return '<p class="text-red-500">You are not eligible for this race</p>';
        }

        if (this.currentRace.requiresWhitelist && !isWhitelisted) {
            return '<p class="text-yellow-500">This race requires whitelist access</p>';
        }

        return '<p class="text-green-500">You are eligible for this race</p>';
    }

    /**
     * Check if user can join race
     * @private
     */
    _canJoinRace() {
        if (!this.currentRace) return false;
        if (this.currentRace.status !== 'WAITING') return false;
        if (this.currentRace.currentRiders >= this.currentRace.maxRiders) return false;

        const profile = profileManager.currentProfile;
        if (!profile) return true; // Allow join attempt for non-logged in users

        // Check whitelist/blacklist
        if (profileManager.isBlacklisted(this.currentRace.id)) return false;
        if (this.currentRace.requiresWhitelist && !profileManager.isWhitelisted(this.currentRace.id)) return false;

        return true;
    }

    /**
     * Generate join requirements HTML
     * @private
     */
    _generateJoinRequirements() {
        const requirements = [];

        if (!profileManager.currentProfile) {
            requirements.push('Link your profile to access all features');
        } else {
            if (!profileManager.hasRequiredAuth()) {
                requirements.push('Link required accounts (Discord or Steam)');
            }
            if (!profileManager.profileData.gameGuid) {
                requirements.push('Link your game ID');
            }
        }

        if (requirements.length === 0) {
            return '<p class="text-yellow-500">Race is currently not accepting new riders</p>';
        }

        return `
            <div class="requirements-list">
                <h4 class="text-lg font-bold mb-2">Requirements:</h4>
                <ul class="list-disc list-inside">
                    ${requirements.map(req => `<li class="text-yellow-500">${req}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Generate manager controls HTML
     * @private
     */
    _generateManagerControls() {
        return `
            <div class="manager-controls mt-4">
                <h3 class="text-lg font-bold mb-2">Race Manager Controls</h3>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="rankedManager.startRace()" 
                            class="bg-green-600 text-white px-4 py-2 rounded"
                            ${this.currentRace.status !== 'WAITING' ? 'disabled' : ''}>
                        Start Race
                    </button>
                    <button onclick="rankedManager.endRace()"
                            class="bg-red-600 text-white px-4 py-2 rounded"
                            ${this.currentRace.status !== 'IN_PROGRESS' ? 'disabled' : ''}>
                        End Race
                    </button>
                </div>
                <div class="whitelist-controls mt-2">
                    <input type="text" 
                           id="whitelistInput" 
                           placeholder="Enter Profile ID"
                           class="bg-gray-700 text-white px-4 py-2 rounded w-full mb-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="rankedManager.addToWhitelist()"
                                class="bg-blue-600 text-white px-4 py-2 rounded">
                            Add to Whitelist
                        </button>
                        <button onclick="rankedManager.addToBlacklist()"
                                class="bg-gray-600 text-white px-4 py-2 rounded">
                            Add to Blacklist
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update results display with live timing
     * @private
     */
    _updateResultsDisplay() {
        const resultsDisplay = document.getElementById('liveResults');
        if (!resultsDisplay) return;

        const sortedResults = Array.from(this.liveResults.values())
            .sort((a, b) => a.position - b.position);

        resultsDisplay.innerHTML = `
            <div class="results-header">
                <h3 class="text-xl font-bold">Live Results</h3>
            </div>
            <div class="results-grid">
                ${sortedResults.map(result => this._generateResultRow(result)).join('')}
            </div>
        `;
    }

    /**
     * Generate result row HTML
     * @private
     */
    _generateResultRow(result) {
        return `
            <div class="result-row ${result.status.toLowerCase()}">
                <span class="position">${result.position}</span>
                <span class="rider-name">${result.riderName}</span>
                <span class="best-lap">${this._formatTime(result.bestLap)}</span>
                <span class="total-time">${this._formatTime(result.totalTime)}</span>
                <span class="status">${result.status}</span>
            </div>
        `;
    }

    /**
     * Format time in mm:ss.ms format
     * @private
     */
    _formatTime(ms) {
        if (!ms) return '--:--.---';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    /**
     * Join current race
     * @public
     */
    async joinRace() {
        if (!this._canJoinRace()) return;

        try {
            const response = await dataManager.loadData('race_instances', {
                raceId: this.currentRace.id,
                action: 'join',
                profileId: profileManager.currentProfile?.id
            });

            if (response.connectUrl) {
                this._generateConnectLink(response.connectUrl);
                this._notifyDiscord('rider_joined', {
                    raceId: this.currentRace.id,
                    riderId: response.riderId,
                    riderName: profileManager.currentProfile?.username || 'Anonymous'
                });
            }
        } catch (error) {
            console.error('Failed to join race:', error);
            this._showError('Failed to join race. Please try again.');
        }
    }

    /**
     * Generate and display connect link
     * @private
     */
    _generateConnectLink(url) {
        const connectModal = document.getElementById('connectModal');
        if (!connectModal) return;

        connectModal.innerHTML = `
            <div class="modal-content">
                <h3>Race Connection</h3>
                <p>Click the button below to join the race:</p>
                <a href="${url}" class="connect-button">
                    Connect to Race
                </a>
                <p class="help-text">
                    Make sure MXBikes is running before clicking the connect button.
                </p>
            </div>
        `;
        connectModal.style.display = 'block';
    }

    /**
     * Notify Discord of events
     * @private
     */
    async _notifyDiscord(type, data) {
        if (!profileManager.profileData.linkedAccounts.discord) return;

        try {
            await dataManager.loadData('discord/notify', {
                type,
                data: {
                    ...data,
                    discordId: profileManager.profileData.linkedAccounts.discord.id
                }
            });
        } catch (error) {
            console.error('Failed to notify Discord:', error);
        }
    }

    /**
     * Show error message
     * @private
     */
    _showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        if (!errorDisplay) return;

        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        setTimeout(() => {
            errorDisplay.style.display = 'none';
        }, 5000);
    }

    /**
     * Add profile to whitelist (race managers only)
     * @public
     */
    async addToWhitelist() {
        if (!profileManager.raceManagerStatus || !this.currentRace) return;

        const input = document.getElementById('whitelistInput');
        if (!input || !input.value) return;

        try {
            await profileManager.addToWhitelist(input.value, this.currentRace.id);
            input.value = '';
            this._updateRaceDisplay();
        } catch (error) {
            console.error('Failed to add to whitelist:', error);
            this._showError('Failed to add to whitelist. Please try again.');
        }
    }

    /**
     * Add profile to blacklist (race managers only)
     * @public
     */
    async addToBlacklist() {
        if (!profileManager.raceManagerStatus || !this.currentRace) return;

        const input = document.getElementById('whitelistInput');
        if (!input || !input.value) return;

        try {
            await profileManager.addToBlacklist(input.value, this.currentRace.id);
            input.value = '';
            this._updateRaceDisplay();
        } catch (error) {
            console.error('Failed to add to blacklist:', error);
            this._showError('Failed to add to blacklist. Please try again.');
        }
    }

    /**
     * Start current race (race managers only)
     * @public
     */
    async startRace() {
        if (!profileManager.raceManagerStatus || !this.currentRace) return;

        try {
            await dataManager.loadData('race_instances', {
                raceId: this.currentRace.id,
                action: 'start'
            });
        } catch (error) {
            console.error('Failed to start race:', error);
            this._showError('Failed to start race. Please try again.');
        }
    }

    /**
     * End current race (race managers only)
     * @public
     */
    async endRace() {
        if (!profileManager.raceManagerStatus || !this.currentRace) return;

        try {
            await dataManager.loadData('race_instances', {
                raceId: this.currentRace.id,
                action: 'end'
            });
        } catch (error) {
            console.error('Failed to end race:', error);
            this._showError('Failed to end race. Please try again.');
        }
    }
}

// Export as singleton
export const rankedManager = new RankedManager();
