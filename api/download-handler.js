const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Helper to get download directory
async function getDownloadDir() {
    // Default to user's Downloads folder
    const defaultDir = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'MXBikes');
    try {
        await fs.mkdir(defaultDir, { recursive: true });
        return defaultDir;
    } catch (error) {
        console.error('Error creating download directory:', error);
        throw error;
    }
}

// MediaFire handler
async function handleMediaFire(url, downloadDir) {
    const browser = await puppeteer.launch({ headless: "new" });
    try {
        const page = await browser.newPage();
        
        // Configure download behavior
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir
        });

        // Navigate to MediaFire page
        await page.goto(url);
        
        // Wait for and click download button
        await page.waitForSelector('#downloadButton');
        await page.click('#downloadButton');
        
        // Wait for download to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } finally {
        await browser.close();
    }
}

// Mega handler
async function handleMega(url, downloadDir) {
    const browser = await puppeteer.launch({ headless: "new" });
    try {
        const page = await browser.newPage();
        
        // Configure download behavior
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir
        });

        // Navigate to Mega page
        await page.goto(url);
        
        // Wait for and click download button
        await page.waitForSelector('.download-button');
        await page.click('.download-button');
        
        // Wait for download to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } finally {
        await browser.close();
    }
}

// Google Drive handler
async function handleGoogleDrive(url, downloadDir) {
    const browser = await puppeteer.launch({ headless: "new" });
    try {
        const page = await browser.newPage();
        
        // Configure download behavior
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir
        });

        // Navigate to Drive page
        await page.goto(url);
        
        // Wait for and click download button
        await page.waitForSelector('[aria-label="Download"]');
        await page.click('[aria-label="Download"]');
        
        // Wait for download to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } finally {
        await browser.close();
    }
}

// Main download handler
async function handleDownload(url) {
    const downloadDir = await getDownloadDir();
    
    // Detect hosting service
    if (url.includes('mediafire.com')) {
        await handleMediaFire(url, downloadDir);
    } else if (url.includes('mega.nz')) {
        await handleMega(url, downloadDir);
    } else if (url.includes('drive.google.com')) {
        await handleGoogleDrive(url, downloadDir);
    } else {
        throw new Error('Unsupported hosting service');
    }
    
    return { downloadDir };
}

module.exports = { handleDownload };
