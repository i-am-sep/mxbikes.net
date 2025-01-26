document.addEventListener('DOMContentLoaded', function() {
    const modContainer = document.getElementById('mod-container');
    const tracksList = document.getElementById('tracksGrid');
    const categories = document.querySelectorAll('.category');
    const searchBar = document.querySelector('.search-bar');
    const modDetailsPopup = document.getElementById('mod-details-popup');
    const popupCloseButton = document.getElementById('popup-close');
    let allMods = [];
    let allTracks = [];

    // Function to truncate text
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Function to create mod/track cards
    function createCard(item, type) {
        const card = document.createElement('div');
        card.classList.add('card', type);
        
        const description = item.description || 'No description available.';
        const truncatedDescription = truncateText(description, 150);

        card.innerHTML = `
            <h3 class="track-title">${item.title}</h3>
            <p class="track-creator">by ${item.creator || ''}</p>
            <img src="${item.images?.cover || item.images?.additional?.[0] || 'https://i.imgur.com/HpB66vX.png'}" alt="${item.title}" class="track-image">
            <p class="track-description">${truncatedDescription}</p>
            <div class="download-links"></div>
        `;

        // Add download buttons to card
        const downloadsContainer = card.querySelector('.download-links');
        if (item.downloads?.by_host) {
            Object.entries(item.downloads.by_host).forEach(([host, urls]) => {
                urls.forEach(url => {
                    const linkButton = document.createElement('a');
                    linkButton.href = url;
                    linkButton.target = '_blank';
                    linkButton.className = 'download-button';
                    linkButton.textContent = `Download from ${host}`;
                    downloadsContainer.appendChild(linkButton);
                });
            });
        }

        card.addEventListener('click', (e) => {
            // Don't trigger popup if clicking download buttons
            if (!e.target.classList.contains('download-button')) {
                showDetailsPopup(item, type);
            }
        });

        return card;
    }

    function loadMods() {
        fetch('/api/mods')
            .then(response => response.json())
            .then(data => {
                allMods = data;
                if (modContainer) {
                    renderMods(allMods);
                }
            })
            .catch(handleError('Error loading mods'));
    }

    function loadTracks() {
        fetch('/api/tracks')
            .then(response => response.json())
            .then(tracks => {
                allTracks = tracks;
                if (tracksList) {
                    renderTracks(tracks);
                }
            })
            .catch(handleError('Error loading tracks'));
    }

    function renderMods(mods) {
        if (!modContainer) return;
        modContainer.innerHTML = '';
        const noModsMessage = document.getElementById('no-mods-message');
        if (mods.length > 0) {
            mods.forEach(mod => {
                modContainer.appendChild(createCard(mod, 'mod'));
            });
            noModsMessage.classList.add('hidden');
        } else {
            noModsMessage.classList.remove('hidden');
        }
    }

    function renderTracks(tracks) {
        if (!tracksList) return;
        tracksList.innerHTML = '';
        const noModsMessage = document.getElementById('no-mods-message');
        if (tracks.length > 0) {
            tracks.forEach(track => {
                tracksList.appendChild(createCard(track, 'track'));
            });
            noModsMessage?.classList.add('hidden');
        } else {
            if (noModsMessage) {
                noModsMessage.classList.remove('hidden');
            } else {
                tracksList.innerHTML = '<p class="error-message">No tracks found.</p>';
            }
        }
    }

    // Popup functionality
    function showDetailsPopup(item, type) {
        const popupTitle = modDetailsPopup.querySelector('#popup-title');
        const popupImage = modDetailsPopup.querySelector('#popup-image');
        const popupDescription = modDetailsPopup.querySelector('#popup-description');
        
        popupTitle.textContent = item.title;
        popupImage.src = item.images?.cover || item.images?.additional?.[0] || 'https://i.imgur.com/HpB66vX.png';
        
        // Format description for better readability
        const description = item.description || 'No description available.';
        const formattedDescription = description.split('\n').map(line => line.trim()).join('\n');
        popupDescription.textContent = formattedDescription;
    
        const downloadsContainer = modDetailsPopup.querySelector('#popup-downloads');
        downloadsContainer.innerHTML = '';
        downloadsContainer.className = 'download-links-grid';
    
        // Add direct download links
        if (item.downloads?.by_host) {
            Object.entries(item.downloads.by_host).forEach(([host, urls]) => {
                urls.forEach(url => {
                    const linkButton = document.createElement('a');
                    linkButton.href = url;
                    linkButton.target = '_blank';
                    linkButton.className = 'version-button';
                    linkButton.textContent = `Download from ${host}`;
                    downloadsContainer.appendChild(linkButton);
                });
            });
        }
    
        modDetailsPopup.style.display = 'block';
    }

    function hideDetailsPopup() {
        modDetailsPopup.style.display = 'none';
    }

    if (popupCloseButton) {
        popupCloseButton.addEventListener('click', hideDetailsPopup);
    }

    // Close popup when clicking outside
    modDetailsPopup.addEventListener('click', function(e) {
        if (e.target === modDetailsPopup) {
            hideDetailsPopup();
        }
    });

    // Filtering and Search
    if (categories) {
        categories.forEach(category => {
            category.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                filterContent();
            });
        });
    }

    function filterContent() {
        if (!searchBar) return;
        
        const searchTerm = searchBar.value.toLowerCase();
        const selectedCategory = document.querySelector('.category.active')?.dataset.category || 'all';

        let filteredMods = allMods;
        let filteredTracks = allTracks;

        // Apply search filter
        if (searchTerm) {
            const searchFilter = item => 
                item.title.toLowerCase().includes(searchTerm) ||
                (item.creator && item.creator.toLowerCase().includes(searchTerm)) ||
                (item.description && item.description.toLowerCase().includes(searchTerm));

            filteredMods = filteredMods.filter(searchFilter);
            filteredTracks = filteredTracks.filter(searchFilter);
        }

        // Apply category filter if on mods page
        if (selectedCategory !== 'all' && modContainer) {
            filteredMods = filteredMods.filter(mod => 
                mod.mod_type?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        if (modContainer) {
            renderMods(filteredMods);
        }
        if (tracksList) {
            renderTracks(filteredTracks);
        }
    }

    if (searchBar) {
        searchBar.addEventListener('input', filterContent);
    }

    // Error handling helper function
    function handleError(message) {
        return error => {
            console.error(message, error);
            const errorContainer = document.createElement('div');
            errorContainer.className = "error-message";
            errorContainer.textContent = message + ": " + (error.message || error);
            const container = modContainer || tracksList;
            if (container) {
                container.appendChild(errorContainer);
            }
        };
    }

    // Initialize
    if (modContainer) loadMods();
    if (tracksList) loadTracks();
});
