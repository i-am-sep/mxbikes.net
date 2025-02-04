const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { handleDownload } = require('./download-handler');
const { Sequelize } = require('sequelize');

const app = express();
const port = process.env.PORT || 3000;

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            ca: fs.readFileSync(path.join(__dirname, '..', 'ca-certificate.crt')).toString()
        }
    },
    logging: false
});

// Enable CORS for specified origins
app.use(cors({
    origin: ['https://mxbikes.net', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    next();
});

// Health check endpoint for App Platform
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await sequelize.authenticate();
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Helper function to read JSON files
async function readJsonFile(filename) {
    const filePath = path.join(__dirname, '..', 'static', 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

// Helper function to write JSON files
async function writeJsonFile(filename, data) {
    const filePath = path.join(__dirname, '..', 'static', 'data', filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Helper function to get download URL for a track
async function getTrackDownloadUrl(id) {
    const data = await readJsonFile('tracks.json');
    const track = data.tracks.find(t => t.id === id);
    if (track && track.downloads && track.downloads.length > 0) {
        return track.downloads[0].url;
    }
    return null;
}

// Helper function to increment download count for tracks
async function incrementTrackDownloads(id) {
    const data = await readJsonFile('tracks.json');
    const track = data.tracks.find(t => t.id === id);
    
    if (track) {
        if (!track.downloadCount) {
            track.downloadCount = 0;
        }
        track.downloadCount++;
        await writeJsonFile('tracks.json', data);
        return { downloadCount: track.downloadCount, downloads: track.downloads };
    }
    return null;
}

// Tracks endpoints
app.get('/api/tracks', async (req, res) => {
    try {
        const data = await readJsonFile('tracks.json');
        res.json(data.tracks);
    } catch (error) {
        console.error('Error reading tracks:', error);
        res.status(500).json({ error: 'Failed to load tracks' });
    }
});

// Track direct download endpoint
app.post('/api/tracks/:id/direct-download', async (req, res) => {
    try {
        console.log('Processing direct download request for track:', req.params.id);
        const { id } = req.params;
        
        // Get track info and increment download count
        const downloadInfo = await incrementTrackDownloads(id);
        if (!downloadInfo) {
            console.log('Track not found:', id);
            return res.status(404).json({ error: 'Track not found' });
        }

        // Get download URL from track data if not provided in request
        let downloadUrl = req.body?.url;
        if (!downloadUrl) {
            downloadUrl = await getTrackDownloadUrl(id);
            if (!downloadUrl) {
                console.log('No download URL available for track:', id);
                return res.status(400).json({ error: 'No download URL available' });
            }
        }

        console.log('Starting download process for URL:', downloadUrl);
        
        // Handle the direct download
        const result = await handleDownload(downloadUrl);
        console.log('Download completed:', result);
        
        res.json({
            ...downloadInfo,
            downloadDir: result.downloadDir
        });
    } catch (error) {
        console.error('Error handling direct download:', error);
        res.status(500).json({ 
            error: 'Failed to handle download',
            details: error.message
        });
    }
});

// Stats endpoints
app.get('/api/tracks/popular', async (req, res) => {
    try {
        const data = await readJsonFile('tracks.json');
        const sorted = [...data.tracks].sort((a, b) => 
            (b.downloadCount || 0) - (a.downloadCount || 0)
        ).slice(0, 10);
        res.json(sorted);
    } catch (error) {
        console.error('Error getting popular tracks:', error);
        res.status(500).json({ error: 'Failed to get popular tracks' });
    }
});

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body
    });
    res.status(500).json({ 
        error: 'Something broke!',
        details: err.message
    });
});

// 404 handler with logging
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ 
        error: 'Not found',
        path: req.url,
        method: req.method
    });
});

// Initialize server
async function initServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Start server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`API endpoints available:`);
            console.log(`- GET /api/health (App Platform health check)`);
            console.log(`- GET /api/tracks`);
            console.log(`- POST /api/tracks/:id/direct-download`);
            console.log(`- GET /api/tracks/popular`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
}

initServer();
