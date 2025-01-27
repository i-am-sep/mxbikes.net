document.addEventListener('DOMContentLoaded', function() {
    // Core UI Elements
    const UI = {
        modContainer: document.getElementById('mod-container'),
        noModsMessage: document.getElementById('no-mods-message'),
        trackSearch: document.getElementById('track-search'),
        categoryButtons: document.querySelectorAll('.category')
    };

    // Store data globally for filtering
    let productsData = [];
    let currentCategory = 'all';

    // Get the current page from pathname
    const currentPath = window.location.pathname;
    const isTracksPage = currentPath.endsWith('tracks') || currentPath.includes('/tracks');
    const isDownloadsPage = currentPath.endsWith('downloads') || currentPath.includes('/downloads');

    // Initialize based on current page
    if (isTracksPage || isDownloadsPage) {
        loadProducts();
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
        filterAndRenderProducts(searchTerm, currentCategory);
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
        filterAndRenderProducts(searchTerm, currentCategory);
    }

    /**
     * Filters and renders products based on search term and category
     */
    function filterAndRenderProducts(searchTerm, category) {
        let filteredProducts = productsData;

        // Apply category filter for downloads page
        if (category !== 'all') {
            filteredProducts = productsData.filter(product => {
                if (category === 'tracks') return product.type === 'track';
                if (category === 'bikes') return product.type === 'bike';
                if (category === 'gear') return product.type === 'gear';
                if (category === 'misc') return product.type === 'misc';
                return false;
            });
        }

        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.title?.toLowerCase().includes(searchTerm) ||
                product.creator?.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredProducts.length === 0) {
            showNoModsMessage();
        } else {
            renderProducts(filteredProducts);
        }
    }

    /**
     * Loads product data from API endpoint with fallback to local JSON
     */
    async function loadProducts() {
        try {
            console.log('Attempting to load products from API...');
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('API not available');
            }
            const data = await response.json();
            console.log('Products loaded from API');
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No products found in API');
            }

            productsData = data;
            renderProducts(data);
        } catch (error) {
            console.log('API fetch failed, falling back to local JSON:', error);
            try {
                const response = await fetch('/static/data/tracks.json');
                if (!response.ok) {
                    throw new Error('Local JSON not available');
                }
                const data = await response.json();
                console.log('Products loaded from local JSON');

                if (!data || Object.keys(data).length === 0) {
                    throw new Error('No products found in local JSON');
                }

                productsData = Object.values(data);
                renderProducts(productsData);
            } catch (localError) {
                console.error('Error loading products from both sources:', localError);
                handleError('Error loading products', localError);
            }
        }
    }

    /**
     * Gets download links from product data
     * @param {Object} product - Product data object
     * @returns {Array} Array of download links
     */
    function getDownloadLinks(product) {
        if (!product.downloads) return [];
        
        // Use the consolidated links array from enhanced to_dict()
        if (Array.isArray(product.downloads.links)) {
            return product.downloads.links;
        }
        
        return [];
    }

    /**
     * Renders product data in a table format
     * @param {Array} products - Array of product data to render
     */
    function renderProducts(products) {
        if (!UI.modContainer) {
            console.error('Mod container not found');
            return;
        }
        
        UI.modContainer.innerHTML = products.map(product => {
            const downloadLinks = getDownloadLinks(product);
            return `
                <tr class="track-row">
                    <td class="track-cell">
                        <div class="track-info">
                            ${product.images && product.images.cover ? `
                                <img src="${product.images.cover}" alt="${product.title}" class="track-thumbnail">
                            ` : ''}
                            <span class="track-title">${product.title || 'Untitled'}</span>
                        </div>
                    </td>
                    <td class="creator-cell">${product.creator || 'Unknown'}</td>
                    <td class="description-cell">
                        ${product.description ? product.description.split('\n')[0] : 'No description available'}
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
