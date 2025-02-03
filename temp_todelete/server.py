import os
from app import create_app

# Get environment from FLASK_ENV, default to development
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # In production, use 0.0.0.0 to accept connections from any IP
    host = '0.0.0.0' if env == 'production' else 'localhost'
    
    # Debug mode based on environment
    debug = env in ['development', 'staging']
    
    print(f'Starting server in {env} mode on {host}:{port}')
    app.run(host=host, port=port, debug=debug)
