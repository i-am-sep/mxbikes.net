document.addEventListener('DOMContentLoaded', function() {
    /**
     * Core UI Elements
     * @type {Object}
     */
    const UI = {
        tracksList: document.getElementById('tracksGrid'),
        categories: document.querySelectorAll('.category'),
        searchBar: document.querySelector('.search-bar'),
        modDetailsPopup: document.getElementById('mod-details-popup'),
        infoModal: document.getElementById('infoModal'),
        popupCloseButton: document.getElementById('popup-close')
    };

    /**
     * Application State
     * @type {Object}
     */
    const state = {
        allTracks: [],
        currentCategory: 'all'
    };

    /**
     * Initialize disabled tabs functionality
     */
    function initializeDisabledTabs() {
        document.querySelectorAll('.tab.disabled').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                return false;
            });
        });
    }

    /**
     * Modal Functions
     */
    window.openModal = function() {
        if (UI.infoModal) {
            UI.infoModal.style.display = 'block';
        }
    }

    window.closeModal = function() {
        if (UI.infoModal) {
            UI.infoModal.style.display = 'none';
        }
    }

    /**
     * Truncates text to specified length and adds ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length before truncation
     * @returns {string} Truncated text
     */
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * Formats download links into URL and hostname pairs
     * @param {Object} downloads - Download information object
     * @returns {Array} Array of formatted download links
     */
    function formatDownloadLinks(downloads) {
        if (!downloads?.links) return [];
        return downloads.links.map(link => ({
            url: link,
            host: new URL(link).hostname
        }));
    }

    /**
     * Gets placeholder image URL from meta tag or defaults
     * @returns {string} Placeholder image URL
     */
    function getPlaceholderImage() {
        return document.querySelector('meta[name="placeholder-image"]')?.content 
            || '/static/assets/images/placeholder.jpg';
    }

    /**
     * Handles image loading errors by falling back to placeholder
     * @param {HTMLImageElement} img - Image element that failed to load
     */
    function handleImageError(img) {
        const placeholder = getPlaceholderImage();
        if (img.src !== placeholder) {
            img.src = placeholder;
        }
    }

    /**
     * Creates a card element for a track or mod item
     * @param {Object} item - Track/mod data
     * @param {string} type - Type of card to create
     * @returns {HTMLElement} Card element
     */
    function createCard(item, type) {
        if (!item) return null;

        const card = document.createElement('div');
        card.classList.add('card', type);
        
        const description = truncateText(item.description || 'No description available.', 150);
        const imageUrl = item.images?.cover || getPlaceholderImage();

        card.innerHTML = `
            <h3 class="track-title">${item.title || 'Untitled'}</h3>
            <p class="track-creator">by ${item.creator || 'Unknown'}</p>
            <img src="${imageUrl}" alt="${item.title || 'Track image'}" class="track-image" onerror="this.onerror=null; handleImageError(this);">
            <p class="track-description">${description}</p>
            <div class="download-links"></div>
        `;

        const downloadsContainer = card.querySelector('.download-links');
        formatDownloadLinks(item.downloads).forEach(({url, host}) => {
            const linkButton = document.createElement('a');
            linkButton.href = url;
            linkButton.target = '_blank';
            linkButton.className = 'download-button';
            linkButton.textContent = `Download from ${host}`;
            downloadsContainer.appendChild(linkButton);
        });

        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('download-button')) {
                showDetailsPopup(item, type);
            }
        });

        return card;
    }

    /**
     * Loads track data from JSON file
     */
    async function loadTracks() {
        if (!UI.tracksList) return;

        try {
            const response = await fetch('/static/data/tracks.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            state.allTracks = data.items || [];
            renderTracks(state.allTracks);
        } catch (error) {
            handleError('Error loading tracks', error);
        }
    }

    /**
     * Renders track cards to the tracks grid
     * @param {Array} tracks - Array of track data to render
     */
    function renderTracks(tracks) {
        if (!UI.tracksList) return;
        
        UI.tracksList.innerHTML = tracks.length 
            ? tracks.map(track => createCard(track, 'track')?.outerHTML || '').join('')
            : '<p class="error-message">No tracks found.</p>';
    }

    /**
     * Shows detailed popup for a track/mod item
     * @param {Object} item - Track/mod data
     * @param {string} type - Type of item
     */
    function showDetailsPopup(item, type) {
        if (!UI.modDetailsPopup) return;

        const elements = {
            title: UI.modDetailsPopup.querySelector('#popup-title'),
            image: UI.modDetailsPopup.querySelector('#popup-image'),
            description: UI.modDetailsPopup.querySelector('#popup-description'),
            downloads: UI.modDetailsPopup.querySelector('#popup-downloads')
        };
        
        if (elements.title) elements.title.textContent = item.title || 'Untitled';
        if (elements.image) {
            elements.image.src = item.images?.cover || getPlaceholderImage();
            elements.image.onerror = () => elements.image.src = getPlaceholderImage();
        }
        
        if (elements.description) {
            const description = item.description || 'No description available.';
            elements.description.textContent = description.split('\n')
                .map(line => line.trim()).join('\n');
        }
    
        if (elements.downloads) {
            elements.downloads.innerHTML = '';
            elements.downloads.className = 'download-links-grid';
        
            formatDownloadLinks(item.downloads).forEach(({url, host}) => {
                const linkButton = document.createElement('a');
                linkButton.href = url;
                linkButton.target = '_blank';
                linkButton.className = 'version-button';
                linkButton.textContent = `Download from ${host}`;
                elements.downloads.appendChild(linkButton);
            });
        }
    
        UI.modDetailsPopup.style.display = 'block';
    }

    /**
     * Hides the details popup
     */
    function hideDetailsPopup() {
        if (UI.modDetailsPopup) {
            UI.modDetailsPopup.style.display = 'none';
        }
    }

    /**
     * Filters content based on category and search term
     */
    function filterContent() {
        if (!UI.searchBar) return;
        
        const searchTerm = UI.searchBar.value.toLowerCase();
        let filteredContent = state.allTracks;

        if (state.currentCategory !== 'all') {
            filteredContent = filteredContent.filter(item => 
                item.category === state.currentCategory
            );
        }

        if (searchTerm) {
            filteredContent = filteredContent.filter(item => 
                (item.title?.toLowerCase().includes(searchTerm)) ||
                (item.creator?.toLowerCase().includes(searchTerm)) ||
                (item.description?.toLowerCase().includes(searchTerm))
            );
        }

        renderTracks(filteredContent);
    }

    /**
     * Handles errors by displaying them to the user
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    function handleError(message, error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = "error-message";
        errorContainer.textContent = `${message}: ${error.message || error}`;
        
        if (UI.tracksList) {
            UI.tracksList.appendChild(errorContainer);
        }
    }

    /**
     * Initialize event listeners
     */
    function initializeEventListeners() {
        // Popup close events
        if (UI.popupCloseButton) {
            UI.popupCloseButton.addEventListener('click', hideDetailsPopup);
        }

        if (UI.modDetailsPopup) {
            UI.modDetailsPopup.addEventListener('click', function(e) {
                if (e.target === UI.modDetailsPopup) {
                    hideDetailsPopup();
                }
            });
        }

        // Category filtering
        UI.categories.forEach(category => {
            category.addEventListener('click', () => {
                UI.categories.forEach(c => c.classList.remove('active'));
                category.classList.add('active');
                state.currentCategory = category.dataset.category;
                filterContent();
            });
        });

        // Search functionality
        if (UI.searchBar) {
            UI.searchBar.addEventListener('input', filterContent);
        }
    }

    // Initialize application
    initializeDisabledTabs();
    initializeEventListeners();
    loadTracks();
});
