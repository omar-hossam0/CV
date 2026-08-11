# Skill Analyzer Service Startup Script
# Uses: model-3-skill-analyzer/skill_analyzer.py (Port 5003)

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "Starting Skill Analyzer Service" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan

# Check if virtual environment exists
Write-Host "`nChecking Python environment..." -ForegroundColor Yellow
$venvPath = ".\.venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    & $venvPath
} elseif (Test-Path "model-3-skill-analyzer\venv\Scripts\Activate.ps1") {
    & "model-3-skill-analyzer\venv\Scripts\Activate.ps1"
}

# Navigate to model-3-skill-analyzer directory
Write-Host "Navigating to model-3-skill-analyzer directory..." -ForegroundColor Yellow
Set-Location model-3-skill-analyzer

# Check if required files exist
Write-Host "`nChecking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "skill_analyzer.py",
    "requirements.txt"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  Found: $file" -ForegroundColor Green
    } else {
        Write-Host "  Missing: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`nERROR: Required files are missing!" -ForegroundColor Red
    Write-Host "Please ensure model-3-skill-analyzer directory is complete." -ForegroundColor Yellow
    pause
    exit 1
}

# Install dependencies if needed
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
python -c "import flask" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Set environment variable
$env:PORT = "5003"

# Start the service
Write-Host "`nStarting Skill Analyzer Service on port 5003..." -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan
python skill_analyzer.py
