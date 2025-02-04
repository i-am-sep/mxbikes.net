/**
 * Template Loader for MXBikes.net
 * Handles loading and inserting header and footer templates
 */

export class TemplateLoader {
    static async loadTemplate(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${path}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Template loading error:', error);
            return null;
        }
    }

    static async insertTemplates() {
        // Load header template
        const headerContent = await this.loadTemplate('/static/templates/header.html');
        if (headerContent) {
            // Find existing nav or create a new container
            const existingNav = document.querySelector('nav.chrome-tabs');
            if (existingNav) {
                existingNav.outerHTML = headerContent;
            } else {
                const headerContainer = document.createElement('div');
                headerContainer.innerHTML = headerContent;
                document.body.insertBefore(headerContainer.firstChild, document.body.firstChild);
            }
        }

        // Load footer template
        const footerContent = await this.loadTemplate('/static/templates/footer.html');
        if (footerContent) {
            // Find existing footer or create a new one
            const existingFooter = document.querySelector('footer.site-footer');
            if (existingFooter) {
                existingFooter.outerHTML = footerContent;
            } else {
                document.body.insertAdjacentHTML('beforeend', footerContent);
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TemplateLoader.insertTemplates();
});
