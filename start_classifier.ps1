# CV Classifier Service Startup Script
# Run this script to start the CV classification service
# Uses: model-2-cv-classifier/cv_classifier.py (Port 5002)

Write-Host "Starting CV Classifier Service..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path "model-2-cv-classifier\.env")) {
    Write-Host "Warning: .env file not found in model-2-cv-classifier!" -ForegroundColor Yellow
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path "model-2-cv-classifier\.env.example") {
        Copy-Item "model-2-cv-classifier\.env.example" "model-2-cv-classifier\.env"
        Write-Host ".env file created. Please edit it and add your GROQ_API_KEY" -ForegroundColor Green
        Write-Host ""
        Write-Host "To get a free Groq API key:" -ForegroundColor Cyan
        Write-Host "1. Visit: https://console.groq.com" -ForegroundColor White
        Write-Host "2. Sign up (free)" -ForegroundColor White
        Write-Host "3. Go to API Keys section" -ForegroundColor White
        Write-Host "4. Copy your API key" -ForegroundColor White
        Write-Host "5. Paste it in model-2-cv-classifier\.env file" -ForegroundColor White
        Write-Host ""
        
        $continue = Read-Host "Press Enter after setting up your API key..."
    }
}

# Check if requirements are installed
Write-Host ""
Write-Host "Checking Python dependencies..." -ForegroundColor Cyan

$pythonCmd = "python"
try {
    & $pythonCmd --version | Out-Null
} catch {
    Write-Host "Python not found! Please install Python first." -ForegroundColor Red
    exit 1
}

Write-Host "Python found" -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "model-2-cv-classifier\venv")) {
    Write-Host "Virtual environment not found. Creating one..." -ForegroundColor Yellow
    & $pythonCmd -m venv model-2-cv-classifier\venv
    Write-Host "Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& "model-2-cv-classifier\venv\Scripts\Activate.ps1"

# Install requirements
Write-Host "Installing/updating requirements..." -ForegroundColor Cyan
& pip install -r model-2-cv-classifier\requirements.txt --quiet

Write-Host ""
Write-Host "All checks passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting CV Classifier Service on port 5002..." -ForegroundColor Cyan
Write-Host "   Access at: http://localhost:5002" -ForegroundColor White
Write-Host "   Health check: http://localhost:5002/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

# Start the service
Set-Location model-2-cv-classifier
& python cv_classifier.py
