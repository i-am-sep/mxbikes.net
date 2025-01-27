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
    let currentCategory = 'All';

    // Get the current page from pathname
    const currentPath = window.location.pathname;
    const isTracksPage = currentPath.endsWith('tracks.html') || currentPath.includes('/tracks');
    const isDownloadsPage = currentPath.endsWith('downloads.html') || currentPath.includes('/downloads');

    // Initialize based on current page
    if (isTracksPage || isDownloadsPage) {
        loadProducts();
        // Add search event listener
        if (UI.trackSearch) {
            UI.trackSearch.addEventListener('input', handleTrackSearch);
        }

        // Add category filter UI for tracks page
        if (isTracksPage) {
            initializeCategoryFilters();
        }
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

        // Add category buttons once data is loaded
        loadProducts().then(() => {
            // Get unique categories from products
            const categories = ['All', ...new Set(productsData.map(p => p.category))];
            
            categoryContainer.innerHTML = categories.map(category => `
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
        let filteredProducts = productsData;

        // Apply category filter
        if (category !== 'All') {
            filteredProducts = filteredProducts.filter(product => product.category === category);
        }

        // Apply search filter
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.name?.toLowerCase().includes(searchTerm) ||
                product.creator?.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredProducts.length === 0) {
            showNoModsMessage();
        } else {
            renderProducts(filteredProducts);
        }
    }

    /**
     * Loads product data from API endpoint
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
            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            handleError('Error loading content', error);
        }
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
        
        UI.modContainer.innerHTML = products.map(product => `
            <tr class="track-row">
                <td class="track-cell">
                    <div class="track-info">
                        ${product.thumbnail ? `
                            <img src="${product.thumbnail}" alt="${product.name}" class="track-thumbnail">
                        ` : ''}
                        <span class="track-title font-medium">${product.name || 'Untitled'}</span>
                    </div>
                </td>
                <td class="creator-cell">${product.creator || 'Unknown'}</td>
                <td class="category-cell">
                    <span class="category-badge">${product.category || 'Uncategorized'}</span>
                </td>
                <td class="download-cell">
                    <div class="flex flex-col">
                        ${product.downloads && product.downloads.length ? 
                            product.downloads.map(download => `
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
