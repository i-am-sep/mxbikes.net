# PowerShell deployment script

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment
)

# Function to write logs with timestamps
function Write-Log {
    param($Message)
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): $Message"
}

Write-Log "Deploying to $Environment environment..."

# Handle untracked files and pull latest code
Write-Log "Handling git repository..."
try {
    # Stash any changes including untracked files
    git stash push --include-untracked
    
    Write-Log "Pulling latest code from GitHub..."
    git pull origin main
    
    # Pop the stash if there were changes
    git stash pop
} catch {
    Write-Log "Warning: Git operations failed. Error: $_"
}

# Create and activate virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Log "Creating virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Write-Log "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

# Install/update dependencies
Write-Log "Installing/updating dependencies..."
pip install -r requirements.txt

# Set environment variables based on environment
if ($Environment -eq "staging") {
    $env:FLASK_ENV = "staging"
    $env:FLASK_DEBUG = "1"
} else {
    $env:FLASK_ENV = "production"
    $env:FLASK_DEBUG = "0"
}

# Create/update .env file
@"
FLASK_ENV=$env:FLASK_ENV
FLASK_DEBUG=$env:FLASK_DEBUG
SECRET_KEY=your-secret-key-here
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Stop existing Flask process if running
$flaskProcess = Get-Process -Name "python" -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*server.py*" }
if ($flaskProcess) {
    Write-Log "Stopping existing Flask process..."
    Stop-Process -Id $flaskProcess.Id -Force
}

# Start Flask application
Write-Log "Starting Flask application..."
$flaskProcess = Start-Process python -ArgumentList "server.py" -NoNewWindow -PassThru

# Wait for application to start
Write-Log "Waiting for application to start..."
Start-Sleep -Seconds 5

# Basic health check
$maxRetries = 3
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Log "Deployment successful! Application is running."
            $success = $true
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Log "Attempt $retryCount failed. Retrying in 5 seconds..."
            Start-Sleep -Seconds 5
        } else {
            Write-Log "Warning: Application health check failed after $maxRetries attempts."
            Write-Log "Error: $($_.Exception.Message)"
            
            # Check if process is still running
            if (-not $flaskProcess.HasExited) {
                Write-Log "Process is still running. Checking logs..."
                Get-Content ".\app.log" -Tail 20
            } else {
                Write-Log "Process has exited with code: $($flaskProcess.ExitCode)"
            }
        }
    }
}

if (-not $success) {
    Write-Log "Deployment completed with warnings. Please check the logs for details."
} else {
    Write-Log "Deployment completed successfully!"
}
