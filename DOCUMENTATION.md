# MXBikes.net Project Documentation

## Project Overview
MXBikes.net is a website dedicated to the MXBikes gaming community, featuring bike downloads, tracks, and community features. The project consists of both a static website hosted on GitHub Pages and a separate API server infrastructure.

## Current Architecture

### 1. Frontend (GitHub Pages)
- **Status**: Partially functional with some broken features
- **Host**: GitHub Pages (static hosting)
- **Tech Stack**:
  - HTML5
  - CSS (Tailwind CSS)
  - Vanilla JavaScript
  - Static assets

### 2. Backend API Server
- **Status**: Production and Development environments
- **Environments**:
  - Production: mxbikes.app (DigitalOcean App Platform)
  - Development: mxbikes.xyz (DigitalOcean App Platform)
- **Tech Stack**:
  - Node.js/Express
  - PostgreSQL (VPC-enabled)
  - Puppeteer for download management

## Current State Analysis

### Working Features
1. **Home Page**
   - A-Kit bike features showcase
   - Multiple download options (MediaFire, Google Drive, MEGA)
   - Discord community integration
   - Two Stroke bikes section
   - Additional files section

2. **Static Pages**
   - Basic navigation structure
   - Footer with social links
   - Modal information system

### Known Issues
1. **Functionality Breaks**
   - API calls failing on GitHub Pages
   - Disabled navigation items:
     - Racing
     - Ranked
     - Rider
     - Bikes

2. **Architectural Issues**
   - Mismatch between dynamic API calls and static hosting
   - Missing static data structure
   - Lack of error handling
   - No loading states
   - No fallback content

## Project Structure

```
mxbikes.net/
├── index.html              # Main landing page
├── api/                    # Backend API server
│   ├── download-handler.js # Puppeteer download manager
│   ├── server.js          # Main API server
│   └── test-db.js         # Database testing
├── static/
│   ├── assets/
│   │   └── images/        # Site images
│   ├── data/
│   │   ├── mods.json      # Mods data
│   │   └── tracks.json    # Tracks data
│   ├── templates/
│   │   ├── header.html    # Site header
│   │   └── footer.html    # Site footer
│   ├── header-footer.css  # Header/footer styles
│   ├── home.css          # Home page styles
│   ├── home.js           # Home page scripts
│   ├── navigation.js     # Navigation functionality
│   ├── scripts.js        # General scripts
│   └── styles.css        # General styles
├── sections/             # Main site sections
│   ├── bikes/
│   ├── downloads/
│   ├── mods/
│   ├── racing/
│   ├── ranked/
│   ├── rider/
│   ├── shop/
│   └── tracks/
└── config files
    ├── app.yaml          # Production config
    ├── app.dev.yaml      # Development config
    └── _config.yml       # GitHub Pages config
```

## API Infrastructure

### Server Configuration
- **Database**: PostgreSQL on DigitalOcean (VPC-enabled)
- **Security**: 
  - Private networking
  - SSL/TLS encryption
  - CORS restrictions

### API Endpoints
1. **Health Check**
   - `GET /api/health`

2. **Tracks**
   - `GET /api/tracks`
   - `POST /api/tracks/:id/direct-download`
   - `GET /api/tracks/popular`

### Security Measures
1. **VPC Network**
   - Database accessible only through private network
   - API server within same VPC
   - External traffic routed through API

2. **CORS Configuration**
   - Restricted to authorized domains:
     - https://mxbikes.app
     - https://mxbikes.xyz
     - http://localhost:3000

## Recommended Improvements

### 1. Static Site Enhancement
- Implement static data structure
- Add proper error handling
- Include loading states
- Create fallback content
- Enable disabled navigation items

### 2. Data Management
- Convert dynamic calls to static JSON
- Implement proper error boundaries
- Structure data for easy updates
- Add client-side caching

### 3. User Experience
- Add loading indicators
- Improve error messaging
- Enhance navigation structure
- Optimize asset loading

### 4. Maintenance
- Regular data file updates
- Asset optimization
- CDN implementation
- Backup strategy

## Credits and Ownership
- **Creator**: Alex Nagy (Scrallex)
- **Model Credits**:
  - Daniele (d1istraction) – Ducati
  - Julien (Julien113) – Yamaha, Kawasaki, Stark, Fantic 250/450
  - Isaiah (Eyezaya) – Honda, KTM, Husky, Suzuki, Beta, Triumph
  - Caden (cadens) – GasGas
  - TM Factory Racing – TM 250/450

## License
Proprietary and confidential.
Copyright © 2024 MXBikes.net. All rights reserved.
