# Skill Analyzer Service Startup Script

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "🚀 Starting TensorFlow Skill Analyzer Service" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan

# Activate virtual environment
Write-Host "`n📦 Activating Python environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Navigate to ml-service directory
Write-Host "📂 Navigating to ml-service directory..." -ForegroundColor Yellow
Set-Location ml-service

# Check if required files exist
Write-Host "`n🔍 Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "..\last-one\tokenizer.pkl",
    "..\last-one\skills_list.json", 
    "..\last-one\cv_job_matcher_model.h5"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`n❌ ERROR: Required model files are missing!" -ForegroundColor Red
    Write-Host "Please ensure the model is trained first." -ForegroundColor Yellow
    pause
    exit 1
}

# Install dependencies if needed
Write-Host "`n📥 Checking dependencies..." -ForegroundColor Yellow
python -c "import tensorflow" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing TensorFlow..." -ForegroundColor Yellow
    pip install tensorflow keras flask flask-cors
}

# Set environment variable
$env:PORT = "5003"

# Start the service
Write-Host "`n🚀 Starting Skill Analyzer Service on port 5003..." -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan
python skill_analyzer_service.py
