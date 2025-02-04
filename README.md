# MXBikes.net API

Secure API server for MXBikes.net with VPC database access and download tracking.

## Environments

- **Production**: mxbikes.app (DigitalOcean App Platform)
- **Development**: mxbikes.xyz (DigitalOcean App Platform)

## Architecture

- **API Server**: Node.js/Express application
- **Database**: PostgreSQL on DigitalOcean (VPC-enabled)
- **Download Handler**: Puppeteer-based automated download manager
- **Security**: Private networking, SSL/TLS encryption

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0
- DigitalOcean account with VPC access
- PostgreSQL database in VPC network
- SSL certificate for database connection
- Puppeteer-compatible Chrome/Chromium installation

## Local Development Setup

1. Install dependencies:
```bash
cd api
npm install
```

2. Set up environment variables:
```bash
# Create .env file
DATABASE_URL=postgres://mxbikes-net:${DB_PASSWORD}@private-dbaas-db-8731719-do-user-18540873-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://mxbikes.app,https://mxbikes.xyz
DOWNLOAD_PATH=./downloads
```

3. Database Setup:
```bash
# Install PostgreSQL (if not already installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Initialize database
psql -h localhost -U postgres
CREATE DATABASE mxbikes;
\c mxbikes

# Run migrations (ensure you're in the api directory)
npm run migrate
```

4. Start development server:
```bash
npm run dev
```

## Deployment

### Production (mxbikes.app)

1. Install DigitalOcean CLI:
```bash
# macOS
brew install doctl

# Windows
scoop install doctl

# Linux
snap install doctl
```

2. Authenticate with DigitalOcean:
```bash
doctl auth init
```

3. Deploy to production:
```bash
# Create the production app
doctl apps create --spec app.yaml

# Get the app ID
doctl apps list

# Update production deployment
doctl apps update [app-id] --spec app.yaml
```

### Development Network (mxbikes.xyz)

1. Create development app specification:
```bash
# Copy production spec to development
cp app.yaml app.dev.yaml

# Update environment in app.dev.yaml:
# - Set NODE_ENV=development
# - Update database connection
# - Configure development domains
```

2. Deploy to development:
```bash
# Create the development app
doctl apps create --spec app.dev.yaml

# Get the app ID
doctl apps list

# Update development deployment
doctl apps update [dev-app-id] --spec app.dev.yaml
```

## API Endpoints

### Health Check
- `GET /api/health`
  - Response: `{ "status": "healthy", "timestamp": "ISO-8601 timestamp" }`

### Tracks
- `GET /api/tracks`
  - Query Parameters:
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 20)
    - `sort` (optional): Sort field (default: "downloads")
  - Response: `{ "tracks": [...], "total": number, "page": number, "pages": number }`

- `POST /api/tracks/:id/direct-download`
  - Parameters:
    - `id`: Track identifier
  - Response: `{ "downloadUrl": "string", "expiresAt": "ISO-8601 timestamp" }`

- `GET /api/tracks/popular`
  - Query Parameters:
    - `limit` (optional): Number of tracks (default: 10)
    - `period` (optional): Time period ("day", "week", "month", default: "week")
  - Response: `{ "tracks": [...], "period": "string" }`

## Error Handling

### HTTP Status Codes
- 200: Successful request
- 400: Bad request (invalid parameters)
- 401: Unauthorized
- 403: Forbidden
- 404: Resource not found
- 429: Too many requests
- 500: Internal server error

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional information
  }
}
```

## Security Configuration

### VPC Network
- Database accessible only through private network
- API server deployed within same VPC
- All external traffic routed through API

### SSL/TLS
- Required for all database connections
- CA certificate verification enabled
- Secure connection string with SSL mode required

### CORS
- Restricted to authorized domains:
  - https://mxbikes.app (Production)
  - https://mxbikes.xyz (Development)
  - http://localhost:3000 (Local development)
- Methods limited to GET/POST/OPTIONS
- Content-Type and Authorization headers allowed

## Monitoring

### Health Metrics
- Server uptime and response times
- Database connection pool status
- Memory usage and CPU load
- Active connections count

### Business Metrics
- Download counts (hourly/daily/monthly)
- Popular tracks and peak usage times
- Error rates and types
- API endpoint usage statistics

### Monitoring Tools
- DigitalOcean Monitoring
  - Production metrics (mxbikes.app)
  - Development metrics (mxbikes.xyz)
- Custom health check endpoint
- Error logging to external service
- Performance metrics dashboard

## Development Guidelines

1. Always use private networking for database access
2. Keep SSL certificates secure and up to date
3. Use environment variables for sensitive data
4. Test health check endpoint before deployment
5. Monitor download tracking functionality
6. Follow REST API best practices
7. Document all code changes
8. Write unit tests for new features
9. Test changes on development network before production deployment

## Troubleshooting

### Database Connection Issues
1. Verify VPC configuration
2. Check SSL certificate validity
3. Confirm database credentials
4. Test connection with provided test script
5. Check firewall rules and security groups

### Download Handler Issues
1. Check Puppeteer configuration
2. Verify download directory permissions
3. Monitor browser console logs
4. Check network connectivity
5. Verify Chrome/Chromium installation
6. Check for memory leaks
7. Monitor download queue status

### Environment-Specific Issues
1. Verify correct domain configuration
2. Check environment variables
3. Confirm database connection strings
4. Test CORS settings
5. Validate SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request
6. Ensure tests pass
7. Update documentation
8. Test on development network (mxbikes.xyz)

## License

This project is proprietary and confidential.
Copyright © 2024 MXBikes.net. All rights reserved.
