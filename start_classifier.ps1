# CV Classifier Service Startup Script
# Run this script to start the CV classification service

Write-Host "🚀 Starting CV Classifier Service..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path "ml-service\.env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path "ml-service\.env.example") {
        Copy-Item "ml-service\.env.example" "ml-service\.env"
        Write-Host "✅ .env file created. Please edit it and add your GROQ_API_KEY" -ForegroundColor Green
        Write-Host ""
        Write-Host "To get a free Groq API key:" -ForegroundColor Cyan
        Write-Host "1. Visit: https://console.groq.com" -ForegroundColor White
        Write-Host "2. Sign up (free)" -ForegroundColor White
        Write-Host "3. Go to API Keys section" -ForegroundColor White
        Write-Host "4. Copy your API key" -ForegroundColor White
        Write-Host "5. Paste it in ml-service\.env file" -ForegroundColor White
        Write-Host ""
        
        $continue = Read-Host "Press Enter after setting up your API key..."
    }
}

# Check if model file exists
Write-Host "🔍 Checking for model file..." -ForegroundColor Cyan
$modelFound = $false

if (Test-Path "cv_classifier_merged.keras") {
    Write-Host "✅ Model found in root directory" -ForegroundColor Green
    $modelFound = $true
}

if (Test-Path "ml-service\cv_classifier_merged.keras") {
    Write-Host "✅ Model found in ml-service directory" -ForegroundColor Green
    $modelFound = $true
}

if (-not $modelFound) {
    Write-Host "❌ Error: cv_classifier_merged.keras not found!" -ForegroundColor Red
    Write-Host "   Please make sure the model file exists in:" -ForegroundColor Yellow
    Write-Host "   - CV-project-\cv_classifier_merged.keras" -ForegroundColor White
    Write-Host "   OR" -ForegroundColor Yellow
    Write-Host "   - CV-project-\ml-service\cv_classifier_merged.keras" -ForegroundColor White
    exit 1
}

# Check if requirements are installed
Write-Host ""
Write-Host "📦 Checking Python dependencies..." -ForegroundColor Cyan

$pythonCmd = "python"
try {
    & $pythonCmd --version | Out-Null
} catch {
    Write-Host "❌ Python not found! Please install Python first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python found" -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "ml-service\venv")) {
    Write-Host "⚠️  Virtual environment not found. Creating one..." -ForegroundColor Yellow
    & $pythonCmd -m venv ml-service\venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Cyan
& "ml-service\venv\Scripts\Activate.ps1"

# Install requirements
Write-Host "📦 Installing/updating requirements..." -ForegroundColor Cyan
& pip install -r ml-service\requirements_classifier.txt --quiet

Write-Host ""
Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting CV Classifier Service on port 5002..." -ForegroundColor Cyan
Write-Host "   Access at: http://localhost:5002" -ForegroundColor White
Write-Host "   Health check: http://localhost:5002/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

# Start the service
Set-Location ml-service
& python cv_classifier_service.py
