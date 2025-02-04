/**
 * MXBikes.net Core Application
 * Handles initialization and progressive enhancement
 */

import { dataManager } from './data-manager.js';
import { UIComponents } from './ui-components.js';

class MXBikesApp {
    constructor() {
        this.initialized = false;
        this.activeSection = null;
        this.apiEndpoint = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) return;

        // Setup error handling
        window.onerror = this.handleError.bind(this);
        window.onunhandledrejection = this.handlePromiseError.bind(this);

        // Try to detect API endpoint
        await this.detectAPI();

        // Initialize data manager
        await dataManager.initialize(this.apiEndpoint);

        // Setup navigation
        this.setupNavigation();

        // Load current section
        await this.loadCurrentSection();

        // Setup live updates if API is available
        if (dataManager.isApiAvailable) {
            this.setupLiveUpdates();
        }

        this.initialized = true;
    }

    /**
     * Attempt to detect API endpoint
     */
    async detectAPI() {
        const endpoints = [
            'https://api.mxbikes.app',
            'https://api.mxbikes.xyz'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${endpoint}/health`);
                if (response.ok) {
                    this.apiEndpoint = endpoint;
                    break;
                }
            } catch (error) {
                console.warn(`API not available at ${endpoint}`);
            }
        }
    }

    /**
     * Setup navigation handling
     */
    setupNavigation() {
        document.querySelectorAll('.chrome-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                if (tab.classList.contains('disabled')) {
                    e.preventDefault();
                    UIComponents.createNotification('This feature is coming soon!', 'info');
                    return;
                }

                e.preventDefault();
                const href = tab.getAttribute('href');
                await this.navigateToSection(href);
            });
        });

        // Handle browser back/forward
        window.onpopstate = async (event) => {
            await this.loadCurrentSection();
        };
    }

    /**
     * Navigate to a section
     * @param {string} href Section URL
     */
    async navigateToSection(href) {
        const section = href.replace('/index.html', '').replace('/', '');
        
        // Show loading state
        const main = document.querySelector('.main-content');
        main.innerHTML = '';
        main.appendChild(UIComponents.createLoader('lg'));

        try {
            // Load section data
            const data = await this.loadSectionData(section);

            // Update URL
            window.history.pushState({}, '', href);

            // Render section
            await this.renderSection(section, data);
        } catch (error) {
            console.error('Navigation failed:', error);
            main.innerHTML = '';
            main.appendChild(UIComponents.createError('Failed to load section', true, () => {
                this.navigateToSection(href);
            }));
        }
    }

    /**
     * Load data for a section
     * @param {string} section Section name
     * @returns {Promise<Object>}
     */
    async loadSectionData(section) {
        switch (section) {
            case 'tracks':
            case 'mods':
            case 'rankings':
                return await dataManager.loadData(section);
            default:
                return null;
        }
    }

    /**
     * Load and render current section based on URL
     */
    async loadCurrentSection() {
        const path = window.location.pathname;
        const section = path.replace('/index.html', '').replace('/', '');
        
        try {
            const data = await this.loadSectionData(section);
            await this.renderSection(section, data);
        } catch (error) {
            console.error('Failed to load section:', error);
            const main = document.querySelector('.main-content');
            main.innerHTML = '';
            main.appendChild(UIComponents.createError('Failed to load content', true, () => {
                this.loadCurrentSection();
            }));
        }
    }

    /**
     * Render a section with data
     * @param {string} section Section name
     * @param {Object} data Section data
     */
    async renderSection(section, data) {
        const main = document.querySelector('.main-content');
        main.innerHTML = '';

        switch (section) {
            case 'tracks':
                this.renderTracks(main, data);
                break;
            case 'mods':
                this.renderMods(main, data);
                break;
            case 'rankings':
                this.renderRankings(main, data);
                break;
            default:
                // Home page or other static content
                break;
        }

        this.activeSection = section;
    }

    /**
     * Setup live updates for dynamic content
     */
    setupLiveUpdates() {
        if (!dataManager.isApiAvailable) return;

        // Subscribe to rankings updates
        dataManager.subscribe('rankings', (data) => {
            if (this.activeSection === 'rankings') {
                this.renderRankings(document.querySelector('.main-content'), data);
            }
        });

        // Subscribe to other dynamic data as needed
    }

    /**
     * Render tracks section
     * @param {HTMLElement} container Container element
     * @param {Object} data Tracks data
     */
    renderTracks(container, data) {
        if (!data || !data.tracks) {
            container.appendChild(UIComponents.createError('No tracks available'));
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4';

        data.tracks.forEach(track => {
            grid.appendChild(UIComponents.createCard({
                title: track.name,
                content: track.description,
                image: track.image || '/static/assets/images/placeholder.jpg',
                link: track.downloadUrl
            }));
        });

        container.appendChild(grid);
    }

    /**
     * Render mods section
     * @param {HTMLElement} container Container element
     * @param {Object} data Mods data
     */
    renderMods(container, data) {
        if (!data || !data.mods) {
            container.appendChild(UIComponents.createError('No mods available'));
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4';

        data.mods.forEach(mod => {
            grid.appendChild(UIComponents.createCard({
                title: mod.name,
                content: mod.description,
                image: mod.image || '/static/assets/images/placeholder.jpg',
                link: mod.downloadUrl
            }));
        });

        container.appendChild(grid);
    }

    /**
     * Render rankings section
     * @param {HTMLElement} container Container element
     * @param {Object} data Rankings data
     */
    renderRankings(container, data) {
        if (!data || !data.rankings) {
            container.appendChild(UIComponents.createError('No rankings available'));
            return;
        }

        const rankings = document.createElement('div');
        rankings.className = 'p-4';

        // Rankings table
        const headers = ['Position', 'Name', 'Rating', 'Races', 'Wins', 'Podiums'];
        rankings.appendChild(UIComponents.createTable(headers, data.rankings));

        // Recent races
        if (data.recentRaces && data.recentRaces.length > 0) {
            const title = document.createElement('h2');
            title.className = 'text-2xl font-bold text-blue-400 mt-8 mb-4';
            title.textContent = 'Recent Races';
            rankings.appendChild(title);

            const raceHeaders = ['Date', 'Name', 'Track', 'Winner'];
            const raceData = data.recentRaces.map(race => ({
                date: new Date(race.date).toLocaleDateString(),
                name: race.name,
                track: race.track,
                winner: race.results[0]?.name || 'N/A'
            }));
            rankings.appendChild(UIComponents.createTable(raceHeaders, raceData));
        }

        container.appendChild(rankings);
    }

    /**
     * Handle global errors
     * @param {string} message Error message
     * @param {string} source Error source
     * @param {number} lineno Line number
     * @param {number} colno Column number
     * @param {Error} error Error object
     */
    handleError(message, source, lineno, colno, error) {
        console.error('Global error:', { message, source, lineno, colno, error });
        UIComponents.createNotification(
            'An error occurred. Please try again.',
            'error'
        );
    }

    /**
     * Handle unhandled promise rejections
     * @param {PromiseRejectionEvent} event
     */
    handlePromiseError(event) {
        console.error('Unhandled promise rejection:', event.reason);
        UIComponents.createNotification(
            'An error occurred. Please try again.',
            'error'
        );
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new MXBikesApp();
    app.initialize().catch(console.error);
});
