document.addEventListener('DOMContentLoaded', function() {
    const modContainer = document.getElementById('mod-container');
    const tracksList = document.getElementById('tracksGrid');
    const categories = document.querySelectorAll('.category');
    const searchBar = document.querySelector('.search-bar');
    const modDetailsPopup = document.getElementById('mod-details-popup');
    const popupCloseButton = document.getElementById('popup-close-button');
    let allMods = [];
    let allTracks = [];

    // Function to create mod/track cards
    function createCard(item, type) {
        const card = document.createElement('div');
        card.classList.add('card', type);
        card.innerHTML = `
            <h3 class="track-title">${item.title}</h3>
            <p class="track-creator">by ${item.creator || ''}</p>
            <img src="${item.cover_image}" alt="${item.title}" class="track-image">
            <a href="${item.mediafire_download || '#'}" target="_blank" class="download-button">Download</a>
        `;
        card.addEventListener('click', () => showDetailsPopup(item, type));
        return card;
    }

    function loadMods() {
        fetch('/data/mods.json')
            .then(response => response.json())
            .then(data => {
                allMods = Object.values(data);
                renderMods(allMods);
            })
            .catch(handleError('Error loading mods'));
    }

    function renderMods(mods) {
        if (!modContainer) return;
        modContainer.innerHTML = '';
        if (mods.length > 0) {
            const modList = document.createElement('div');
            modList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            mods.forEach(mod => modList.appendChild(createCard(mod, 'mod')));
            modContainer.appendChild(modList);
        } else {
            modContainer.innerHTML = '<p class="error-message">No mods found.</p>';
        }
    }

    function loadTracks() {
        fetch('/data/tracks.json')
            .then(response => response.json())
            .then(tracks => {
                allTracks = tracks;
                renderTracks(tracks);
            })
            .catch(handleError('Error loading tracks'));
    }

    function renderTracks(tracks) {
        if (!tracksList) return;
        tracksList.innerHTML = '';
        if (tracks.length > 0) {
            const trackList = document.createElement('div');
            trackList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            tracks.forEach(track => trackList.appendChild(createCard(track, 'track')));
            tracksList.appendChild(trackList);
        } else {
            tracksList.innerHTML = '<p class="error-message">No tracks found.</p>';
        }
    }

    // Popup functionality
    function showDetailsPopup(item, type) {
        modDetailsPopup.querySelector('#popup-title').textContent = item.title;
        modDetailsPopup.querySelector('#popup-image').src = item.cover_image;
        modDetailsPopup.querySelector('#popup-description').textContent = item.description;
        modDetailsPopup.querySelector('#popup-downloads').innerHTML = '';

        //Dynamically add download links based on available data
        if(item.downloads && Array.isArray(item.downloads)){
            item.downloads.forEach(download => {
                const downloadLink = document.createElement('a');
                downloadLink.href = download.url;
                downloadLink.target = '_blank';
                downloadLink.className = 'download-button';
                downloadLink.textContent = download.label;
                modDetailsPopup.querySelector('#popup-downloads').appendChild(downloadLink);
            });
        } else if (item.mediafire_download) {
            const downloadLink = document.createElement('a');
            downloadLink.href = item.mediafire_download;
            downloadLink.target = '_blank';
            downloadLink.className = 'download-button';
            downloadLink.textContent = 'Download from Mediafire';
            modDetailsPopup.querySelector('#popup-downloads').appendChild(downloadLink);
        }

        modDetailsPopup.style.display = 'block';
    }

    function hideDetailsPopup() {
        modDetailsPopup.style.display = 'none';
    }

    if (popupCloseButton) {
        popupCloseButton.addEventListener('click', hideDetailsPopup);
    }

    // Modal functionality for index page
    const infoModal = document.getElementById('infoModal');
    if (infoModal) {
        window.openModal = function() {
            infoModal.style.display = 'block';
        }

        window.closeModal = function() {
            infoModal.style.display = 'none';
        }

        // Close modal when clicking outside
        infoModal.addEventListener('click', function(e) {
            if (e.target === infoModal) {
                closeModal();
            }
        });
    }

    // Filtering and Search
    categories.forEach(category => {
        category.addEventListener('click', () => {
            categories.forEach(c => c.classList.remove('active'));
            category.classList.add('active');
            const selectedCategory = category.dataset.category;
            const filteredItems = selectedCategory === 'all'
                ? [...allMods, ...allTracks]
                : [...allMods, ...allTracks].filter(item =>
                    item.categories && item.categories.includes(selectedCategory)
                );
            renderMods(filteredItems.filter(item => item.categories && item.categories.includes('bikes')));
            renderTracks(filteredItems.filter(item => item.categories && item.categories.includes('tracks')));
        });
    });

    if (searchBar) {
        searchBar.addEventListener('input', () => {
            const searchTerm = searchBar.value.toLowerCase();
            const filteredItems = [...allMods, ...allTracks].filter(item => {
                return item.title.toLowerCase().includes(searchTerm) || 
                    (item.description && item.description.toLowerCase().includes(searchTerm));
            });
            renderMods(filteredItems.filter(item => 
                item.categories && item.categories.includes('bikes')
            ));
            renderTracks(filteredItems.filter(item => 
                item.categories && item.categories.includes('tracks')
            ));
        });
    }

    // Error handling helper function
    function handleError(message) {
        return error => {
            console.error(message, error);
            const errorContainer = document.createElement('div');
            errorContainer.className = "error-message";
            errorContainer.textContent = message + ": " + (error.message || error);
            const container = error.target === modContainer ? modContainer : tracksList;
            if (container) {
                container.appendChild(errorContainer);
            }
        };
    }

    // Initialize
    if (modContainer) loadMods();
    if (tracksList) loadTracks();
});
