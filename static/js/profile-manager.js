/**
 * Profile Manager for MXBikes.net
 * Handles user profiles, authentication, and race management permissions
 */

import { dataManager } from './data-manager.js';

class ProfileManager {
    constructor() {
        this.currentProfile = null;
        this.authMethods = new Set();
        this.raceManagerStatus = false;

        // Profile data structure
        this.profileData = {
            id: null,
            username: null,
            gameGuid: null,
            linkedAccounts: {
                discord: null,
                steam: null,
                google: null
            },
            permissions: {
                isRaceManager: false,
                canCreateEvents: false,
                canModifyWhitelist: false,
                canModifyBlacklist: false
            },
            raceHistory: [],
            eventAccess: new Map(), // eventId -> accessDetails
            whitelists: new Map(), // eventId -> Set<profileId>
            blacklists: new Map()  // eventId -> Set<profileId>
        };

        // Initialize profile system
        this._initializeProfileSystem();
    }

    /**
     * Initialize profile system
     * @private
     */
    async _initializeProfileSystem() {
        // Check for existing session
        const sessionToken = localStorage.getItem('mxbikes_session');
        if (sessionToken) {
            await this._loadExistingSession(sessionToken);
        }

        // Set up auth method listeners
        this._setupAuthListeners();
    }

    /**
     * Load existing session
     * @private
     */
    async _loadExistingSession(token) {
        try {
            const response = await dataManager.loadData('profile', { token });
            if (response.profile) {
                this.currentProfile = response.profile;
                this._updateProfileUI();
                this._initializeRaceManagerTools();
            }
        } catch (error) {
            console.error('Failed to load session:', error);
            localStorage.removeItem('mxbikes_session');
        }
    }

    /**
     * Set up authentication method listeners
     * @private
     */
    _setupAuthListeners() {
        // Discord Auth
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'DISCORD_AUTH') {
                await this._handleDiscordAuth(event.data.code);
            }
        });

        // Steam Auth
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'STEAM_AUTH') {
                await this._handleSteamAuth(event.data.ticket);
            }
        });
    }

    /**
     * Handle Discord authentication
     * @private
     */
    async _handleDiscordAuth(code) {
        try {
            const response = await dataManager.loadData('auth/discord', { code });
            if (response.success) {
                this.profileData.linkedAccounts.discord = response.discordProfile;
                this.authMethods.add('discord');
                await this._updateProfile();
            }
        } catch (error) {
            console.error('Discord auth failed:', error);
        }
    }

    /**
     * Handle Steam authentication
     * @private
     */
    async _handleSteamAuth(ticket) {
        try {
            const response = await dataManager.loadData('auth/steam', { ticket });
            if (response.success) {
                this.profileData.linkedAccounts.steam = response.steamProfile;
                this.authMethods.add('steam');
                await this._updateProfile();
            }
        } catch (error) {
            console.error('Steam auth failed:', error);
        }
    }

    /**
     * Link game GUID to profile
     * @public
     */
    async linkGameGuid(guid) {
        try {
            const response = await dataManager.loadData('profile/link-guid', { guid });
            if (response.success) {
                this.profileData.gameGuid = guid;
                await this._updateProfile();
                return true;
            }
        } catch (error) {
            console.error('Failed to link GUID:', error);
            return false;
        }
    }

    /**
     * Update profile data
     * @private
     */
    async _updateProfile() {
        try {
            const response = await dataManager.loadData('profile/update', {
                profile: this.profileData
            });
            if (response.success) {
                this._updateProfileUI();
                this._checkRaceManagerStatus();
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    }

    /**
     * Check and update race manager status
     * @private
     */
    async _checkRaceManagerStatus() {
        if (!this.currentProfile) return false;

        try {
            const response = await dataManager.loadData('profile/permissions', {
                profileId: this.currentProfile.id
            });
            
            this.raceManagerStatus = response.isRaceManager;
            this.profileData.permissions = response.permissions;
            
            if (this.raceManagerStatus) {
                this._initializeRaceManagerTools();
            }
            
            return this.raceManagerStatus;
        } catch (error) {
            console.error('Failed to check race manager status:', error);
            return false;
        }
    }

    /**
     * Initialize race manager tools
     * @private
     */
    _initializeRaceManagerTools() {
        if (!this.raceManagerStatus) return;

        // Initialize whitelist/blacklist management
        this._initializeListManagement();
    }

    /**
     * Initialize whitelist/blacklist management
     * @private
     */
    _initializeListManagement() {
        const listManagement = document.getElementById('listManagement');
        if (!listManagement) return;

        listManagement.innerHTML = `
            <div class="list-management-panel">
                <div class="whitelist-section">
                    <h3>Whitelist Management</h3>
                    <div class="whitelist-controls">
                        <input type="text" id="whitelistInput" placeholder="Enter Profile ID">
                        <button onclick="profileManager.addToWhitelist()">Add to Whitelist</button>
                    </div>
                    <div id="whitelistDisplay"></div>
                </div>
                <div class="blacklist-section">
                    <h3>Blacklist Management</h3>
                    <div class="blacklist-controls">
                        <input type="text" id="blacklistInput" placeholder="Enter Profile ID">
                        <button onclick="profileManager.addToBlacklist()">Add to Blacklist</button>
                    </div>
                    <div id="blacklistDisplay"></div>
                </div>
            </div>
        `;
    }

    /**
     * Add profile to whitelist
     * @public
     */
    async addToWhitelist() {
        const input = document.getElementById('whitelistInput');
        if (!input || !input.value) return;

        try {
            const response = await dataManager.loadData('profile/whitelist/add', {
                profileId: input.value,
                eventId: this.currentEventId
            });

            if (response.success) {
                this.whitelists.get(this.currentEventId).add(input.value);
                this._updateListDisplay();
                input.value = '';
            }
        } catch (error) {
            console.error('Failed to add to whitelist:', error);
        }
    }

    /**
     * Add profile to blacklist
     * @public
     */
    async addToBlacklist() {
        const input = document.getElementById('blacklistInput');
        if (!input || !input.value) return;

        try {
            const response = await dataManager.loadData('profile/blacklist/add', {
                profileId: input.value,
                eventId: this.currentEventId
            });

            if (response.success) {
                this.blacklists.get(this.currentEventId).add(input.value);
                this._updateListDisplay();
                input.value = '';
            }
        } catch (error) {
            console.error('Failed to add to blacklist:', error);
        }
    }

    /**
     * Update list display
     * @private
     */
    _updateListDisplay() {
        const whitelistDisplay = document.getElementById('whitelistDisplay');
        const blacklistDisplay = document.getElementById('blacklistDisplay');

        if (whitelistDisplay) {
            whitelistDisplay.innerHTML = Array.from(this.whitelists.get(this.currentEventId) || [])
                .map(id => `
                    <div class="list-item">
                        ${id}
                        <button onclick="profileManager.removeFromWhitelist('${id}')">Remove</button>
                    </div>
                `).join('');
        }

        if (blacklistDisplay) {
            blacklistDisplay.innerHTML = Array.from(this.blacklists.get(this.currentEventId) || [])
                .map(id => `
                    <div class="list-item">
                        ${id}
                        <button onclick="profileManager.removeFromBlacklist('${id}')">Remove</button>
                    </div>
                `).join('');
        }
    }

    /**
     * Remove profile from whitelist
     * @public
     */
    async removeFromWhitelist(profileId) {
        try {
            const response = await dataManager.loadData('profile/whitelist/remove', {
                profileId,
                eventId: this.currentEventId
            });

            if (response.success) {
                this.whitelists.get(this.currentEventId).delete(profileId);
                this._updateListDisplay();
            }
        } catch (error) {
            console.error('Failed to remove from whitelist:', error);
        }
    }

    /**
     * Remove profile from blacklist
     * @public
     */
    async removeFromBlacklist(profileId) {
        try {
            const response = await dataManager.loadData('profile/blacklist/remove', {
                profileId,
                eventId: this.currentEventId
            });

            if (response.success) {
                this.blacklists.get(this.currentEventId).delete(profileId);
                this._updateListDisplay();
            }
        } catch (error) {
            console.error('Failed to remove from blacklist:', error);
        }
    }

    /**
     * Get event access link
     * @public
     */
    async getEventAccessLink(eventId) {
        // Return public link if not authenticated
        if (!this.currentProfile) {
            return this._getPublicEventLink(eventId);
        }

        try {
            const response = await dataManager.loadData('events/access-link', {
                eventId,
                profileId: this.currentProfile.id
            });

            if (response.success) {
                this.eventAccess.set(eventId, response.accessDetails);
                return response.accessLink;
            }
        } catch (error) {
            console.error('Failed to get event access link:', error);
            // Fallback to public link
            return this._getPublicEventLink(eventId);
        }
    }

    /**
     * Get public event link
     * @private
     */
    _getPublicEventLink(eventId) {
        return `${window.location.origin}/events/${eventId}/join`;
    }

    /**
     * Update profile UI
     * @private
     */
    _updateProfileUI() {
        const profileDisplay = document.getElementById('profileDisplay');
        if (!profileDisplay || !this.currentProfile) return;

        profileDisplay.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <h3>${this.currentProfile.username}</h3>
                    ${this.raceManagerStatus ? '<span class="manager-badge">Race Manager</span>' : ''}
                </div>
                <div class="linked-accounts">
                    ${this._generateLinkedAccountsHTML()}
                </div>
                <div class="profile-stats">
                    <div>Races: ${this.profileData.raceHistory.length}</div>
                    <div>Events: ${this.eventAccess.size}</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for linked accounts
     * @private
     */
    _generateLinkedAccountsHTML() {
        const accounts = [];
        if (this.profileData.linkedAccounts.discord) {
            accounts.push(`<div class="account discord">Discord</div>`);
        }
        if (this.profileData.linkedAccounts.steam) {
            accounts.push(`<div class="account steam">Steam</div>`);
        }
        if (this.profileData.linkedAccounts.google) {
            accounts.push(`<div class="account google">Google</div>`);
        }
        if (this.profileData.gameGuid) {
            accounts.push(`<div class="account game">Game ID</div>`);
        }
        return accounts.join('');
    }

    /**
     * Check if profile has required authentication
     * @public
     */
    hasRequiredAuth() {
        return this.authMethods.size >= 1 && this.profileData.gameGuid !== null;
    }

    /**
     * Check if profile is whitelisted for event
     * @public
     */
    isWhitelisted(eventId) {
        if (!this.currentProfile) return false;
        const whitelist = this.whitelists.get(eventId);
        return whitelist ? whitelist.has(this.currentProfile.id) : true;
    }

    /**
     * Check if profile is blacklisted for event
     * @public
     */
    isBlacklisted(eventId) {
        if (!this.currentProfile) return false;
        const blacklist = this.blacklists.get(eventId);
        return blacklist ? blacklist.has(this.currentProfile.id) : false;
    }
}

// Export as singleton
export const profileManager = new ProfileManager();
