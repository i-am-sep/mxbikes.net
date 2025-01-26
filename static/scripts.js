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
    const isTracksPage = currentPath.endsWith('tracks.html') || currentPath.includes('/tracks.html');
    const isDownloadsPage = currentPath.endsWith('downloads.html') || currentPath.includes('/downloads.html');

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
            btn.classList.remove('bg-blue-600');
            btn.classList.add('bg-gray-800');
        });
        button.classList.add('active');
        button.classList.remove('bg-gray-800');
        button.classList.add('bg-blue-600');

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
     * Loads track data from JSON file and displays titles
     */
    async function loadTracks() {
        try {
            console.log('Loading tracks...');
            const response = await fetch('static/data/tracks_min.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Tracks data:', data);
            
            if (!data || !data.items || data.items.length === 0) {
                showNoModsMessage();
                return;
            }

            tracksData = data.items; // Store tracks data globally
            renderTracks(data.items);
        } catch (error) {
            console.error('Error loading tracks:', error);
            handleError('Error loading tracks', error);
        }
    }

    /**
     * Renders track titles to the mod container
     * @param {Array} tracks - Array of track data to render
     */
    function renderTracks(tracks) {
        if (!UI.modContainer) {
            console.error('Mod container not found');
            return;
        }
        
        UI.modContainer.innerHTML = tracks.map(track => `
            <div class="track-item bg-gray-800 rounded-lg p-4">
                ${track.images?.cover ? `
                    <img src="${track.images.cover}" alt="${track.title}" class="w-full h-48 object-cover rounded-lg mb-4">
                ` : ''}
                <h3 class="text-xl font-bold mb-2">${track.title || 'Untitled Track'}</h3>
                ${track.creator ? `<p class="text-gray-400 mb-2">By ${track.creator}</p>` : ''}
                ${track.description ? `<p class="text-gray-300 mb-4">${track.description.split('\n')[0]}</p>` : ''}
                ${track.downloads?.links?.length ? `
                    <div class="flex flex-wrap gap-2">
                        ${track.downloads.links.map((link, index) => `
                            <a href="${link}" target="_blank" 
                               class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors">
                                Download ${track.downloads.links.length > 1 ? (index + 1) : ''}
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

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
                <div class="bg-red-600 text-white p-4 rounded">
                    ${message}: ${error.message || error}
                </div>
            `;
        }
        console.error(message, error);
    }
});
