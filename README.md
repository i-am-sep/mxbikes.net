# MXBikes.net

A static-first website for the MXBikes community, hosted on GitHub Pages with progressive enhancement capabilities.

## Architecture

### Static-First Design
The site is built with a static-first approach, ensuring core functionality works without JavaScript or external services:
- Pure HTML/CSS for core content
- Static JSON data files
- Progressive enhancement for dynamic features
- Fallback content for offline/error states

### Directory Structure
```
mxbikes.net/
├── index.html              # Main landing page
├── static/                 # Static assets
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Core application
│   │   ├── data-manager.js# Data handling
│   │   └── ui-components.js# UI components
│   ├── data/              # Static JSON data
│   │   ├── tracks.json    # Track information
│   │   ├── mods.json      # Mod information
│   │   └── rankings.json  # Rankings data
│   ├── assets/            # Media assets
│   └── templates/         # HTML templates
├── sections/              # Site sections
│   ├── bikes/
│   ├── downloads/
│   ├── mods/
│   ├── racing/
│   ├── ranked/
│   ├── rider/
│   ├── shop/
│   └── tracks/
└── api/                   # API documentation
```

### Key Features
1. **Static Content Delivery**
   - Fast initial page load
   - Works without JavaScript
   - SEO-friendly structure
   - Reliable content access

2. **Progressive Enhancement**
   - Dynamic features when available
   - API integration when online
   - Fallback to static content
   - Graceful degradation

3. **Data Management**
   - Static JSON data files
   - Automatic data updates
   - Caching system
   - Error handling

4. **UI Components**
   - Loading states
   - Error handling
   - Responsive design
   - Accessibility features

## Development

### Prerequisites
- Node.js (for local development server)
- Git
- Basic understanding of HTML/CSS/JavaScript

### Local Development
1. Clone the repository:
```bash
git clone https://github.com/yourusername/mxbikes.net.git
cd mxbikes.net
```

2. Start a local server:
```bash
# Using Python (Python 3)
python -m http.server 8000

# Or using Node.js
npx serve
```

3. Visit `http://localhost:8000`

#### API Environment Variables
To run the API server locally, set the following environment variables:

```bash
export DB_HOST="<database host>"
export DB_PORT=25060
export DB_NAME=defaultdb
export DB_USER="<database user>"
export DB_PASSWORD="<database password>"
export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
```

With these variables set, you can test the connection with:

```bash
node api/test-db.js
```

### Making Changes
1. **Static Content**
   - Edit HTML files directly
   - Update static JSON in `/static/data/`
   - Add assets to `/static/assets/`

2. **Styling**
   - Modify CSS in respective files
   - Use Tailwind classes for components
   - Test responsive layouts

3. **JavaScript**
   - Update modules in `/static/js/`
   - Test with and without API
   - Ensure fallbacks work

### Testing
1. **Basic Testing**
   - Test without JavaScript
   - Verify fallback content
   - Check responsive design

2. **Feature Testing**
   - Test API integration
   - Verify error handling
   - Check loading states

3. **Cross-browser Testing**
   - Test major browsers
   - Verify mobile support
   - Check progressive enhancement

## Deployment

### GitHub Pages Setup
1. Configure repository:
   - Enable GitHub Pages
   - Set branch to `main`
   - Configure custom domain

2. Update DNS:
   - Add CNAME record
   - Configure SSL
   - Verify setup

### Deployment Process
1. Update static data:
```bash
# Update rankings
cp new-rankings.json static/data/rankings.json

# Update tracks
cp new-tracks.json static/data/tracks.json
```

2. Commit and push:
```bash
git add .
git commit -m "Update static data"
git push origin main
```

3. Verify deployment:
- Check GitHub Pages build
- Verify HTTPS
- Test functionality

### Maintenance
1. **Regular Updates**
   - Update static data files
   - Refresh content
   - Check for broken links

2. **Performance**
   - Optimize images
   - Minify CSS/JS
   - Update dependencies

3. **Monitoring**
   - Check GitHub Pages status
   - Monitor API availability
   - Track user feedback

## Integration Points

### API Integration
The site can integrate with backend services when available:
```javascript
// Initialize with API
await dataManager.initialize('https://api.mxbikes.app');

// Falls back to static data if API is unavailable
const data = await dataManager.loadData('rankings');
```

### Discord Integration
Future Discord bot integration points are prepared:
```javascript
// Example Discord command handling
!race results <id>  // Updates rankings.json
!rankings           // Reads from rankings.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License
Copyright © 2024 MXBikes.net. All rights reserved.

## Contact
- Discord: [Join our server](https://discord.gg/mxbikes)
- Instagram: [@awulix](https://instagram.com/awulix)
- YouTube: [@awulix](https://www.youtube.com/@awulix)
- TikTok: [@scrallex](https://www.tiktok.com/@scrallex)
