# ===========================================
# CV/Resume Matching Platform - Local Startup
# ===========================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "CV/Resume Matching Platform - Local Startup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoTest = mongosh --eval "db.runCommand({ping:1})" --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "✗ MongoDB is not running. Please start MongoDB first." -ForegroundColor Red
        Write-Host "  Default port: 27017" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ MongoDB is not running. Please start MongoDB first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Backend; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Model 1
Write-Host "Starting Model 1 (CV-Job Matcher) on port 5001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd model-1-cv-matcher; python cv_job_matcher.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Model 2
Write-Host "Starting Model 2 (CV Classifier) on port 5002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd model-2-cv-classifier; python cv_classifier.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Model 3
Write-Host "Starting Model 3 (Skill Analyzer) on port 5003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd model-3-skill-analyzer; python skill_analyzer.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Model 4
Write-Host "Starting Model 4 (Chat Model) on port 5004..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd model-4-chat-model; python chat_model.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:5174" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor Green
Write-Host "  Model 1:   http://localhost:5001" -ForegroundColor Green
Write-Host "  Model 2:   http://localhost:5002" -ForegroundColor Green
Write-Host "  Model 3:   http://localhost:5003" -ForegroundColor Green
Write-Host "  Model 4:   http://localhost:5004" -ForegroundColor Green
Write-Host "  MongoDB:   localhost:27017" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
