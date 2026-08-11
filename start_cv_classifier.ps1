# Start CV Classifier Service
# Uses: model-2-cv-classifier/cv_classifier.py (Port 5002)

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Starting CV Classifier Service" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if port 5002 is already in use
$existingProcess = Get-NetTCPConnection -LocalPort 5002 -ErrorAction SilentlyContinue

if ($existingProcess) {
    Write-Host "Port 5002 is already in use!" -ForegroundColor Yellow
    Write-Host "   Stopping existing service..." -ForegroundColor Yellow
    
    foreach ($conn in $existingProcess) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
}

# Navigate to model-2-cv-classifier directory
Set-Location -Path "$PSScriptRoot\model-2-cv-classifier"

Write-Host "Starting CV Classifier Service..." -ForegroundColor Cyan
Write-Host "   Location: model-2-cv-classifier/" -ForegroundColor Gray
Write-Host "   Port: 5002" -ForegroundColor Gray
Write-Host "   Script: cv_classifier.py`n" -ForegroundColor Gray

# Start the service in a separate window
Start-Process python -ArgumentList "cv_classifier.py" -WorkingDirectory $PWD

Write-Host "Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 7

# Check if service started successfully
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5002/health' -TimeoutSec 3
    $health = $response.Content | ConvertFrom-Json
    
    Write-Host "`nService started successfully!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Service: $($health.service)" -ForegroundColor White
    Write-Host "`nService URL: http://localhost:5002" -ForegroundColor Cyan
    Write-Host "Health Check: http://localhost:5002/health" -ForegroundColor Cyan
    Write-Host "Classify Endpoint: http://localhost:5002/classify" -ForegroundColor Cyan
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " Service is ready!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
} catch {
    Write-Host "`nFailed to start service!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if Python is installed: python --version" -ForegroundColor White
    Write-Host "   2. Check if required packages are installed" -ForegroundColor White
    Write-Host "   3. Check the terminal output for errors`n" -ForegroundColor White
}
