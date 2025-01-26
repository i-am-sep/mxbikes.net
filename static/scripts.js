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
            const response = await fetch('static/data/tracks.json');
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
            const response = await fetch('static/data/mods.json');
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
            <div class="track-item">
                ${track.images?.cover ? `
                    <img src="${track.images.cover}" alt="${track.title}" class="item-image">
                ` : ''}
                <h3 class="item-title">${track.title || 'Untitled Track'}</h3>
                ${track.creator ? `<p class="item-creator">By ${track.creator}</p>` : ''}
                ${track.description ? `<p class="item-description">${track.description.split('\n')[0]}</p>` : ''}
                ${track.downloads?.links?.length ? `
                    <div class="download-links">
                        ${track.downloads.links.map((link, index) => `
                            <a href="${link}" target="_blank" class="download-button">
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
            <div class="mod-item">
                ${mod.images?.cover ? `
                    <img src="${mod.images.cover}" alt="${mod.title}" class="item-image">
                ` : ''}
                <h3 class="item-title">${mod.title || 'Untitled Mod'}</h3>
                ${mod.creator ? `<p class="item-creator">By ${mod.creator}</p>` : ''}
                ${mod.description ? `<p class="item-description">${mod.description.split('\n')[0]}</p>` : ''}
                <div class="download-links">
                    ${Object.entries(mod.downloads.by_host).map(([host, links]) => 
                        links.map((link, index) => `
                            <a href="${link}" target="_blank" class="download-button">
                                ${host} ${links.length > 1 ? (index + 1) : ''}
                            </a>
                        `).join('')
                    ).join('')}
                    ${mod.downloads.by_type.other ? 
                        mod.downloads.by_type.other.map((link, index) => `
                            <a href="${link}" target="_blank" class="download-button">
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
                <div class="error-message">
                    ${message}: ${error.message || error}
                </div>
            `;
        }
        console.error(message, error);
    }
});
