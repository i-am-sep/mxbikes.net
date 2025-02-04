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
    let currentCategory = 'All';

    // Get the current page from pathname
    const currentPath = window.location.pathname;
    const isTracksPage = currentPath.endsWith('tracks.html') || currentPath.includes('/tracks');
    const isDownloadsPage = currentPath.endsWith('downloads.html') || currentPath.includes('/downloads');

    // Initialize based on current page
    if (isTracksPage || isDownloadsPage) {
        // Show loading state
        showLoadingState();
        
        // Load tracks data
        fetch('./data/tracks.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load tracks data');
                return response.json();
            })
            .then(data => {
                if (!data.tracks || !Array.isArray(data.tracks)) {
                    throw new Error('Invalid tracks data format');
                }
                tracksData = data.tracks;
                renderTracks(tracksData);
                initializeFilters();
            })
            .catch(error => {
                console.error('Error loading tracks:', error);
                showErrorState(error);
            });
    }

    function showLoadingState() {
        if (UI.modContainer) {
            UI.modContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center">
                        <div class="animate-pulse">
                            <div class="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
                            <div class="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    function showErrorState(error) {
        if (UI.modContainer) {
            UI.modContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center">
                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-bold mb-4">Content Temporarily Unavailable</h3>
                            <p class="text-gray-400 mb-4">We're currently experiencing technical difficulties. Please try again later.</p>
                            <div class="text-left text-gray-400 mt-4">
                                <p>In the meantime, you can:</p>
                                <ul class="list-disc list-inside mt-2">
                                    <li>Check out our <a href="./downloads.html" class="text-blue-400 hover:underline">downloads page</a></li>
                                    <li>Join our Discord community</li>
                                    <li>Follow us on social media for updates</li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (UI.noModsMessage) {
            UI.noModsMessage.classList.add('hidden');
        }
    }

    function initializeFilters() {
        // Initialize search
        if (UI.trackSearch) {
            UI.trackSearch.addEventListener('input', handleSearch);
        }

        // Initialize category filters
        const categories = ['All', ...new Set(tracksData.map(track => track.category))];
        const searchContainer = document.querySelector('.search-container');
        
        if (searchContainer) {
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'flex gap-2 mt-4 flex-wrap';
            categoryContainer.innerHTML = categories.map(category => `
                <button 
                    class="category px-4 py-2 rounded ${category === 'All' ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500 transition-colors"
                    data-category="${category}"
                >
                    ${category}
                </button>
            `).join('');
            searchContainer.appendChild(categoryContainer);

            // Add event listeners to category buttons
            categoryContainer.querySelectorAll('.category').forEach(button => {
                button.addEventListener('click', handleCategoryChange);
            });
        }
    }

    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        filterAndRenderTracks(searchTerm, currentCategory);
    }

    function handleCategoryChange(event) {
        const button = event.target;
        currentCategory = button.dataset.category;

        // Update active state
        document.querySelectorAll('.category').forEach(btn => {
            btn.classList.remove('bg-blue-600');
            btn.classList.add('bg-gray-700');
        });
        button.classList.remove('bg-gray-700');
        button.classList.add('bg-blue-600');

        // Filter and render
        const searchTerm = UI.trackSearch ? UI.trackSearch.value.toLowerCase() : '';
        filterAndRenderTracks(searchTerm, currentCategory);
    }

    function filterAndRenderTracks(searchTerm, category) {
        let filtered = tracksData;

        // Apply category filter
        if (category && category !== 'All') {
            filtered = filtered.filter(track => track.category === category);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(track =>
                track.name?.toLowerCase().includes(searchTerm) ||
                track.creator?.toLowerCase().includes(searchTerm)
            );
        }

        if (filtered.length === 0) {
            showNoTracksMessage();
        } else {
            renderTracks(filtered);
        }
    }

    function showNoTracksMessage() {
        if (UI.modContainer) {
            UI.modContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center">
                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-xl font-bold mb-4">No Tracks Found</h3>
                            <p class="text-gray-400">Try adjusting your search or filter criteria</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (UI.noModsMessage) {
            UI.noModsMessage.classList.remove('hidden');
        }
    }

    function renderTracks(tracks) {
        if (!UI.modContainer) return;

        UI.modContainer.innerHTML = tracks.map(track => `
            <tr class="track-row">
                <td class="track-cell">
                    <div class="track-info">
                        ${track.thumbnail ? `
                            <img src="${track.thumbnail}" alt="${track.name}" class="track-thumbnail">
                        ` : ''}
                        <span class="track-title font-medium">${track.name || 'Untitled'}</span>
                    </div>
                </td>
                <td class="creator-cell">${track.creator || 'Unknown'}</td>
                <td class="category-cell">
                    <span class="category-badge">${track.category || 'Uncategorized'}</span>
                </td>
                <td class="download-cell">
                    <div class="flex flex-col">
                        ${track.downloads && track.downloads.length ? 
                            track.downloads.map(download => `
                                <a href="${download.url}" target="_blank" class="download-button">
                                    ${download.type}
                                </a>
                            `).join('') 
                            : 'No download available'
                        }
                    </div>
                </td>
            </tr>
        `).join('');

        if (UI.noModsMessage) {
            UI.noModsMessage.classList.add('hidden');
        }
    }
});
