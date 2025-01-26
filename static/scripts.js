document.addEventListener('DOMContentLoaded', function() {
    // Core UI Elements
    const UI = {
        modContainer: document.getElementById('mod-container'),
        noModsMessage: document.getElementById('no-mods-message')
    };

    // Get the current page from pathname
    const currentPath = window.location.pathname;
    const isTracksPage = currentPath.endsWith('tracks.html') || currentPath.includes('/tracks.html');
    const isDownloadsPage = currentPath.endsWith('downloads.html') || currentPath.includes('/downloads.html');

    // Initialize based on current page
    if (isTracksPage) {
        loadTracks();
    } else if (isDownloadsPage) {
        loadMods();
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

            renderTracks(data.items);
        } catch (error) {
            console.error('Error loading tracks:', error);
            handleError('Error loading tracks', error);
        }
    }

    /**
     * Loads mod data from JSON file and displays titles
     */
    async function loadMods() {
        try {
            console.log('Loading mods...');
            const response = await fetch('static/data/mods_min.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Mods data:', data);
            
            if (!data) {
                showNoModsMessage();
                return;
            }

            // Convert object to array
            const mods = Object.values(data);
            if (mods.length === 0) {
                showNoModsMessage();
                return;
            }

            renderMods(mods);
        } catch (error) {
            console.error('Error loading mods:', error);
            handleError('Error loading mods', error);
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
            <div class="bg-gray-800 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300">
                ${track.images?.cover ? `
                    <img src="${track.images.cover}" alt="${track.title}" class="w-full h-48 object-cover rounded-lg mb-4">
                ` : ''}
                <h3 class="text-xl font-bold mb-4">${track.title || 'Untitled Track'}</h3>
                ${track.creator ? `<p class="text-gray-400 mb-4">By ${track.creator}</p>` : ''}
                ${track.description ? `<p class="text-gray-400 mb-4">${track.description.split('\n')[0]}</p>` : ''}
                ${track.downloads?.links?.length ? `
                    <div class="flex flex-wrap gap-2">
                        ${track.downloads.links.map((link, index) => `
                            <a href="${link}" target="_blank" 
                               class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center">
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
     * Renders mod data to the mod container
     * @param {Array} mods - Array of mod data to render
     */
    function renderMods(mods) {
        if (!UI.modContainer) {
            console.error('Mod container not found');
            return;
        }
        
        UI.modContainer.innerHTML = mods.map(mod => `
            <div class="bg-gray-800 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300">
                ${mod.images?.cover ? `
                    <img src="${mod.images.cover}" alt="${mod.title}" class="w-full h-48 object-cover rounded-lg mb-4">
                ` : ''}
                <h3 class="text-xl font-bold mb-4">${mod.title || 'Untitled Mod'}</h3>
                ${mod.creator ? `<p class="text-gray-400 mb-4">By ${mod.creator}</p>` : ''}
                ${mod.description ? `<p class="text-gray-400 mb-4">${mod.description.split('\n')[0]}</p>` : ''}
                <div class="flex flex-wrap gap-2">
                    ${Object.entries(mod.downloads.by_host).map(([host, links]) => 
                        links.map((link, index) => `
                            <a href="${link}" target="_blank" 
                               class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center">
                                ${host} ${links.length > 1 ? (index + 1) : ''}
                            </a>
                        `).join('')
                    ).join('')}
                    ${mod.downloads.by_type.other ? 
                        mod.downloads.by_type.other.map((link, index) => `
                            <a href="${link}" target="_blank" 
                               class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center">
                                Download ${index + 1}
                            </a>
                        `).join('') : ''
                    }
                </div>
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
                <div class="col-span-full bg-red-900/50 text-red-200 p-4 rounded-lg">
                    ${message}: ${error.message || error}
                </div>
            `;
        }
        console.error(message, error);
    }
});
