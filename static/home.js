class HomeTemplate {
    constructor() {
        this.template = `
            <div class="home-container">
                <nav class="home-nav">
                    <div class="home-nav-links">
                        <a href="static/tracks.html" class="home-nav-link">Tracks</a>
                        <a href="static/downloads.html" class="home-nav-link">Downloads</a>
                        <a href="static/bikes.html" class="home-nav-link">Bikes</a>
                        <a href="static/rider.html" class="home-nav-link">Rider</a>
                        <a href="static/ranked.html" class="home-nav-link">Ranked</a>
                        <a href="static/championship.html" class="home-nav-link">Championship</a>
                    </div>
                </nav>
                <main class="home-content">
                    <div class="home-banner">
                        <h1>Welcome to MX Bikes Mods</h1>
                        <p>Your ultimate destination for high-quality MX Bikes content. Explore our collection of tracks, bikes, and more to enhance your riding experience.</p>
                    </div>
                    <div class="home-highlights">
                        <div class="home-highlight-card">
                            <h3>Featured Tracks</h3>
                            <p>Discover professionally designed tracks that offer unique challenges and authentic racing experiences.</p>
                        </div>
                        <div class="home-highlight-card">
                            <h3>A-Kit Bikes</h3>
                            <p>Experience our premium collection of A-Kit bikes with balanced chassis mass distribution and factory-level customization.</p>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    render() {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = this.template;
        }
    }
}

// Handle dynamic loading
document.addEventListener('DOMContentLoaded', () => {
    const homeTemplate = new HomeTemplate();
    
    // Load template after initial page load
    setTimeout(() => {
        homeTemplate.render();
    }, 100);

    // Handle navigation back to home
    document.addEventListener('click', (e) => {
        const homeLink = e.target.closest('a[href="index.html"]');
        if (homeLink) {
            e.preventDefault();
            homeTemplate.render();
            history.pushState(null, '', homeLink.href);
        }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            homeTemplate.render();
        }
    });
});
