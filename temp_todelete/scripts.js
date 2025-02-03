document.addEventListener('DOMContentLoaded', function() {
    // Core UI Elements
    const UI = {
        modContainer: document.getElementById('mod-container'),
        noModsMessage: document.getElementById('no-mods-message'),
        trackSearch: document.getElementById('track-search'),
        categoryButtons: document.querySelectorAll('.category')
    };

    // Embedded tracks data
    const tracksData = {
        "categories": ["All", "Supercross", "Motocross", "Freeride", "Hybrid"],
        "tracks": [
            {
                "name": "Tcs Session Supercross",
                "creator": "TypicalCanadian",
                "category": "Supercross",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2024/12/SSXTN-png.webp",
                "downloads": [
                    {
                        "type": "MediaFire",
                        "url": "https://www.mediafire.com/file/0k33ojtprf9wqxl/TCs_Session_Supercross.pkz/file"
                    }
                ]
            },
            {
                "name": "Smoksta Flowsdale Mx",
                "creator": "SmokstaJ",
                "category": "Motocross",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2024/12/FlowsDaleMX.webp",
                "downloads": [
                    {
                        "type": "MediaFire",
                        "url": "https://www.mediafire.com/file/nohn52owlql05th/Smoksta_-_Flowsdale_MX.pkz/file"
                    },
                    {
                        "type": "Google Drive",
                        "url": "https://drive.google.com/file/d/15HOIZD4JzchaV6xklVlBDqtJ00kw98EZ/view?usp=sharing"
                    }
                ]
            },
            {
                "name": "Sx2016 Round 03 Anaheim 2",
                "creator": "gdubmx",
                "category": "Supercross",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2019/01/asd2.png",
                "downloads": [
                    {
                        "type": "Mega",
                        "url": "https://mega.nz/#!NIoxHazS!4oqHJe0tUSZPuv7Cl1okKt7RFlfloFeWSGOceXEMzpM"
                    }
                ]
            },
            {
                "name": "Florida Tracks Trails",
                "creator": "insane",
                "category": "Motocross",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2018/12/ftt-800x800.jpg",
                "downloads": [
                    {
                        "type": "OneDrive",
                        "url": "https://1drv.ms/u/s!AmFynRoK33UNg_ownANBF_Tvh4-1UA"
                    }
                ]
            },
            {
                "name": "Hill Country Freeride",
                "creator": "Umpossible",
                "category": "Freeride",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2018/12/hcf-800x500.png",
                "downloads": [
                    {
                        "type": "MediaFire",
                        "url": "http://www.mediafire.com/file/8i5are13i8sno3u/HillCountry.zip/file"
                    }
                ]
            },
            {
                "name": "Umpossible Mountain Freeride",
                "creator": "Umpossible",
                "category": "Freeride",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2018/12/umf-800x500.png",
                "downloads": [
                    {
                        "type": "MediaFire",
                        "url": "http://www.mediafire.com/file/r4510n6ivtgn4ck/UmpossibleMountain.zip/file"
                    }
                ]
            },
            {
                "name": "Backyard Hybrid V2",
                "creator": "TWITCH135",
                "category": "Hybrid",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2018/12/track_image-800x800.png",
                "downloads": [
                    {
                        "type": "MediaFire",
                        "url": "http://www.mediafire.com/file/l1tq1fv6lkatekv/BackyardHybrid_v2.zip/file"
                    }
                ]
            },
            {
                "name": "Ez Sx",
                "creator": "TWITCH135",
                "category": "Supercross",
                "thumbnail": "https://cdn.mxb-mods.com/wp-content/uploads/2018/11/screen0401-800x450.jpg",
                "downloads": [
                    {
                        "type": "MediaFire",
                        "url": "http://www.mediafire.com/file/uwtc7434erh34zh/EZSX.zip/file"
                    }
                ]
            }
        ]
    };

    let currentCategory = 'All';

    // Get the current page from pathname
    const currentPath = window.location.pathname;
    const isTracksPage = currentPath.endsWith('tracks.html') || currentPath.includes('/tracks');
    const isDownloadsPage = currentPath.endsWith('downloads.html') || currentPath.includes('/downloads');

    // Initialize based on current page
    if (isTracksPage || isDownloadsPage) {
        // Add search event listener
        if (UI.trackSearch) {
            UI.trackSearch.addEventListener('input', handleTrackSearch);
        }

        // Add category filter UI for tracks page
        if (isTracksPage) {
            initializeCategoryFilters();
        }

        // Initial render
        renderProducts(tracksData.tracks);
    }

    /**
     * Initializes category filter buttons
     */
    function initializeCategoryFilters() {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;

        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'flex gap-2 mt-4 flex-wrap';
        searchContainer.appendChild(categoryContainer);

        categoryContainer.innerHTML = tracksData.categories.map(category => `
            <button 
                class="category px-4 py-2 rounded ${category === 'All' ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500 transition-colors"
                data-category="${category}"
            >
                ${category}
            </button>
        `).join('');

        // Add event listeners to category buttons
        document.querySelectorAll('.category').forEach(button => {
            button.addEventListener('click', handleCategoryChange);
        });
    }

    /**
     * Handles track search input
     */
    function handleTrackSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        filterAndRenderProducts(searchTerm, currentCategory);
    }

    /**
     * Handles category button clicks
     */
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
        filterAndRenderProducts(searchTerm, currentCategory);
    }

    /**
     * Filters and renders products based on search term and category
     */
    function filterAndRenderProducts(searchTerm, category) {
        let filteredTracks = tracksData.tracks;

        // Apply category filter
        if (category !== 'All') {
            filteredTracks = filteredTracks.filter(track => track.category === category);
        }

        // Apply search filter
        if (searchTerm) {
            filteredTracks = filteredTracks.filter(track =>
                track.name?.toLowerCase().includes(searchTerm) ||
                track.creator?.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredTracks.length === 0) {
            showNoModsMessage();
        } else {
            renderProducts(filteredTracks);
        }
    }

    /**
     * Renders product data in a table format
     * @param {Array} tracks - Array of track data to render
     */
    function renderProducts(tracks) {
        if (!UI.modContainer) {
            console.error('Mod container not found');
            return;
        }
        
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
});
