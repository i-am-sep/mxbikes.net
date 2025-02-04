/**
 * Home page manager for MXBikes.net
 */

import { rankedManager } from './js/ranked-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Add top rankings to home page
    const topRankingsSection = document.createElement('div');
    topRankingsSection.className = 'home-rankings';
    topRankingsSection.innerHTML = `
        <div class="home-section-header">
            <h2>Top Ranked Riders</h2>
            <a href="/ranked/index.html" class="view-all">View Full Rankings</a>
        </div>
        <div id="homeRankings" class="home-rankings-list">
            <!-- Rankings will be inserted by ranked manager -->
        </div>
        <div class="rankings-cta">
            <p>Think you have what it takes to be among the best?</p>
            <p>Join ranked races and climb to the top!</p>
        </div>
    `;

    // Insert after the banner
    const banner = document.querySelector('.home-banner');
    if (banner) {
        banner.after(topRankingsSection);
    }

    // Initialize rankings display
    if (rankedManager) {
        rankedManager.initializeHomeRankings('homeRankings');
    }
});
