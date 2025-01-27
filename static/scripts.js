document.addEventListener('DOMContentLoaded', function() {
    // Core UI Elements
    const UI = {
        modContainer: document.getElementById('mod-container'),
        noModsMessage: document.getElementById('no-mods-message'),
        trackSearch: document.getElementById('track-search'),
        categoryButtons: document.querySelectorAll('.category')
    };

    // Store data globally for filtering
    let tracksData = [];
    let currentCategory = 'all';

    // Get the current page from pathname
    const currentPath = window.location.pathname;
    const isTracksPage = currentPath.endsWith('tracks') || currentPath.includes('/tracks');
    const isDownloadsPage = currentPath.endsWith('downloads') || currentPath.includes('/downloads');

    // Initialize based on current page
    if (isTracksPage || isDownloadsPage) {
        loadTracks();
        // Add search event listener
        if (UI.trackSearch) {
            UI.trackSearch.addEventListener('input', handleTrackSearch);
        }
        // Add category event listeners for downloads page
        if (isDownloadsPage && UI.categoryButtons) {
            UI.categoryButtons.forEach(button => {
                button.addEventListener('click', handleCategoryChange);
            });
        }
    }

    /**
     * Handles track search input
     */
    function handleTrackSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        filterAndRenderTracks(searchTerm, currentCategory);
    }

    /**
     * Handles category button clicks
     */
    function handleCategoryChange(event) {
        const button = event.target;
        currentCategory = button.dataset.category;

        // Update active state
        UI.categoryButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Filter and render
        const searchTerm = UI.trackSearch ? UI.trackSearch.value.toLowerCase() : '';
        filterAndRenderTracks(searchTerm, currentCategory);
    }

    /**
     * Filters and renders tracks based on search term and category
     */
    function filterAndRenderTracks(searchTerm, category) {
        let filteredTracks = tracksData;

        // Apply category filter for downloads page
        if (category !== 'all' && category === 'tracks') {
            filteredTracks = tracksData;
        } else if (category !== 'all') {
            filteredTracks = []; // Other categories are empty
        }

        // Apply search filter
        if (searchTerm) {
            filteredTracks = filteredTracks.filter(track =>
                track.title?.toLowerCase().includes(searchTerm) ||
                track.creator?.toLowerCase().includes(searchTerm) ||
                track.description?.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredTracks.length === 0) {
            showNoModsMessage();
        } else {
            renderTracks(filteredTracks);
        }
    }

    /**
     * Loads track data from API endpoint with fallback to local JSON
     */
    async function loadTracks() {
        try {
            console.log('Attempting to load tracks from API...');
            const response = await fetch('/api/tracks?per_page=50');
            if (!response.ok) {
                throw new Error('API not available');
            }
            const data = await response.json();
            console.log('Tracks loaded from API');
            
            if (!data || !data.items || data.items.length === 0) {
                throw new Error('No tracks found in API');
            }

            tracksData = data.items;
            renderTracks(data.items);
        } catch (error) {
            console.log('API fetch failed, falling back to local JSON:', error);
            try {
                const response = await fetch('/static/data/tracks.json');
                if (!response.ok) {
                    throw new Error('Local JSON not available');
                }
                const data = await response.json();
                console.log('Tracks loaded from local JSON');

                if (!data || Object.keys(data).length === 0) {
                    throw new Error('No tracks found in local JSON');
                }

                tracksData = Object.values(data);
                renderTracks(tracksData);
            } catch (localError) {
                console.error('Error loading tracks from both sources:', localError);
                handleError('Error loading tracks', localError);
            }
        }
    }

    /**
     * Gets download links from track data
     * @param {Object} track - Track data object
     * @returns {Array} Array of download links
     */
    function getDownloadLinks(track) {
        if (!track.downloads) return [];
        
        // Handle by_type structure (primary)
        if (track.downloads.by_type) {
            const links = [];
            Object.values(track.downloads.by_type).forEach(typeLinks => {
                if (Array.isArray(typeLinks)) {
                    links.push(...typeLinks);
                }
            });
            return links;
        }
        
        // Handle by_host structure (fallback)
        if (track.downloads.by_host) {
            const links = [];
            Object.values(track.downloads.by_host).forEach(hostLinks => {
                if (Array.isArray(hostLinks)) {
                    links.push(...hostLinks);
                }
            });
            return links;
        }
        
        // Handle simple links array (legacy)
        if (Array.isArray(track.downloads.links)) {
            return track.downloads.links;
        }
        
        return [];
    }

    /**
     * Renders track data in a table format
     * @param {Array} tracks - Array of track data to render
     */
    function renderTracks(tracks) {
        if (!UI.modContainer) {
            console.error('Mod container not found');
            return;
        }
        
        UI.modContainer.innerHTML = tracks.map(track => {
            const downloadLinks = getDownloadLinks(track);
            return `
                <tr class="track-row">
                    <td class="track-cell">
                        <div class="track-info">
                            ${track.images && track.images.cover ? `
                                <img src="${track.images.cover}" alt="${track.title}" class="track-thumbnail">
                            ` : ''}
                            <span class="track-title">${track.title || 'Untitled Track'}</span>
                        </div>
                    </td>
                    <td class="creator-cell">${track.creator || 'Unknown'}</td>
                    <td class="description-cell">
                        ${track.description ? track.description.split('\n')[0] : 'No description available'}
                    </td>
                    <td class="download-cell">
                        ${downloadLinks.length ? 
                            downloadLinks.map((link, index) => `
                                <a href="${link}" target="_blank" class="download-button">
                                    Download ${downloadLinks.length > 1 ? (index + 1) : ''}
                                </a>
                            `).join('') 
                            : 'No download available'
                        }
                    </td>
                </tr>
            `;
        }).join('');

        if (UI.noModsMessage) {
            UI.noModsMessage.classList.add('hidden');
        }
    }

    /**
     * Shows the no mods found message
     */
    function showNoModsMessage() {
        if (UI.noModsMessage) {
            UI.noModsMessage.classList.remove('hidden');
        }
        if (UI.modContainer) {
            UI.modContainer.innerHTML = '';
        }
    }

    /**
     * Handles errors by displaying them to the user
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    function handleError(message, error) {
        if (UI.modContainer) {
            UI.modContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="error-cell">
                        ${message}: ${error.message || error}
                    </td>
                </tr>
            `;
        }
        console.error(message, error);
    }
});
