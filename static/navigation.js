// Get the current page path
const currentPath = window.location.pathname;

// Function to set active tab based on current path
function setActiveTab() {
    const tabs = document.querySelectorAll('.chrome-tab');
    tabs.forEach(tab => {
        const tabPath = tab.getAttribute('href');
        // Check if the current path matches the tab's href
        if (currentPath.endsWith(tabPath)) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Update page title based on current section
function updatePageTitle() {
    const activeTab = document.querySelector('.chrome-tab.active');
    if (activeTab) {
        const tabName = activeTab.textContent;
        document.title = `MXBikes.net - ${tabName}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setActiveTab();
    updatePageTitle();
});
