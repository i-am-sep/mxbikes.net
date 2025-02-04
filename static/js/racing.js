/**
 * Racing Manager for MXBikes.net
 * Handles event listings, signups, and Discord integration
 */

import { dataManager } from './data-manager.js';
import { profileManager } from './profile-manager.js';

class RacingManager {
    constructor() {
        this.events = new Map();
        this.currentFilters = {
            search: '',
            status: 'all'
        };

        // Initialize racing system
        this._initializeRacing();
    }

    /**
     * Initialize racing system
     * @private
     */
    async _initializeRacing() {
        // Load events
        await this.loadEvents();
        
        // Set up WebSocket handlers for real-time updates
        this._initializeWebSocket();
    }

    /**
     * Initialize WebSocket connection
     * @private
     */
    _initializeWebSocket() {
        dataManager.subscribeToEvent('event_update', (data) => {
            this.events.set(data.id, data);
            this._updateEventsList();
        });

        dataManager.subscribeToEvent('event_closed', (data) => {
            this.events.delete(data.id);
            this._updateEventsList();
        });

        dataManager.subscribeToEvent('signup_update', (data) => {
            const event = this.events.get(data.eventId);
            if (event) {
                event.currentRiders = data.currentRiders;
                this._updateEventsList();
            }
        });
    }

    /**
     * Load events from API
     * @public
     */
    async loadEvents() {
        try {
            const events = await dataManager.loadData('events');
            this.events.clear();
            events.forEach(event => {
                this.events.set(event.id, event);
            });
            this._updateEventsList();
            return events;
        } catch (error) {
            console.error('Failed to load events:', error);
            return [];
        }
    }

    /**
     * Update events list display
     * @private
     */
    _updateEventsList() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        const filteredEvents = Array.from(this.events.values())
            .filter(event => this._filterEvent(event));

        eventsList.innerHTML = filteredEvents.length > 0 ? 
            filteredEvents.map(event => this._generateEventCard(event)).join('') :
            '<div class="text-center text-gray-400 py-8">No events found</div>';
    }

    /**
     * Filter event based on current filters
     * @private
     */
    _filterEvent(event) {
        // Search filter
        if (this.currentFilters.search && 
            !event.name.toLowerCase().includes(this.currentFilters.search.toLowerCase())) {
            return false;
        }

        // Status filter
        if (this.currentFilters.status !== 'all' && 
            event.status !== this.currentFilters.status) {
            return false;
        }

        return true;
    }

    /**
     * Sign up for event
     * @public
     */
    async signUpForEvent(eventId) {
        if (!profileManager.currentProfile) {
            alert('Please sign in to register for events');
            return;
        }

        try {
            const response = await dataManager.loadData('events/signup', {
                eventId,
                profileId: profileManager.currentProfile.id
            });

            if (response.success) {
                // If Discord signup is preferred
                if (response.discordSignup) {
                    window.location.href = response.discordUrl;
                    return;
                }

                // Regular signup success
                alert('Successfully signed up for event!');
                await this.loadEvents(); // Refresh events list
            }
        } catch (error) {
            console.error('Failed to sign up for event:', error);
            alert('Failed to sign up for event. Please try again.');
        }
    }

    /**
     * Filter events by search term
     * @public
     */
    filterEvents(search) {
        this.currentFilters.search = search;
        this._updateEventsList();
    }

    /**
     * Filter events by status
     * @public
     */
    filterByStatus(status) {
        this.currentFilters.status = status;
        this._updateEventsList();
    }

    /**
     * Get event details
     * @public
     */
    async getEventDetails(eventId) {
        try {
            const response = await dataManager.loadData('events/details', {
                eventId
            });

            return response;
        } catch (error) {
            console.error('Failed to get event details:', error);
            return null;
        }
    }

    /**
     * Check if user is registered for event
     * @public
     */
    async isRegistered(eventId) {
        if (!profileManager.currentProfile) return false;

        try {
            const response = await dataManager.loadData('events/check-registration', {
                eventId,
                profileId: profileManager.currentProfile.id
            });

            return response.registered;
        } catch (error) {
            console.error('Failed to check registration:', error);
            return false;
        }
    }

    /**
     * Get event signup link
     * @public
     */
    async getSignupLink(eventId) {
        try {
            const response = await dataManager.loadData('events/signup-link', {
                eventId,
                profileId: profileManager.currentProfile?.id
            });

            return response.signupUrl;
        } catch (error) {
            console.error('Failed to get signup link:', error);
            return null;
        }
    }

    /**
     * Get Discord invite link
     * @public
     */
    async getDiscordInvite(eventId) {
        try {
            const response = await dataManager.loadData('events/discord-invite', {
                eventId,
                profileId: profileManager.currentProfile?.id
            });

            return response.inviteUrl;
        } catch (error) {
            console.error('Failed to get Discord invite:', error);
            return null;
        }
    }
}

// Export as singleton
export const racingManager = new RacingManager();
