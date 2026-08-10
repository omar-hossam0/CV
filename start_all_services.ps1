# Run All Services - CV Project
# This script starts all services needed for CV Classification

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     CV Project - Starting All Services" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$services = @()

# Function to start a service in a new terminal
function Start-ServiceInNewTerminal {
    param(
        [string]$Title,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    Write-Host "Starting $Title..." -ForegroundColor Yellow
    
    $scriptBlock = "Set-Location '$WorkingDirectory'; $Command"
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock -PassThru -WindowStyle Normal
    
    return @{
        Name = $Title
        Process = $process
    }
}

Write-Host "Services to start:" -ForegroundColor Green
Write-Host "   1. CV Classifier Service (Python) - Port 5002" -ForegroundColor White
Write-Host "   2. Skill Analyzer Service (TensorFlow) - Port 5003" -ForegroundColor White
Write-Host "   3. Backend Server (Node.js) - Port 5000" -ForegroundColor White
Write-Host "   4. Frontend (React) - Port 5174" -ForegroundColor White
Write-Host ""

$start = Read-Host "Start all services? (Y/n)"

if ($start -eq "" -or $start -eq "Y" -or $start -eq "y") {
    
    Write-Host ""
    Write-Host "🚀 Starting services..." -ForegroundColor Cyan
    Write-Host ""
    
    # Start CV Classifier Service
    $classifierPath = Join-Path (Get-Location) "ml-service"
    $service1 = Start-ServiceInNewTerminal -Title "CV Classifier Service" -Command "python cv_classifier_service.py" -WorkingDirectory $classifierPath
    $services += $service1
    Start-Sleep -Seconds 2
    
    # Start Skill Analyzer Service
    $analyzerPath = Join-Path (Get-Location) "ml-service"
    $service2 = Start-ServiceInNewTerminal -Title "Skill Analyzer Service" -Command "python skill_analyzer_service.py" -WorkingDirectory $analyzerPath
    $services += $service2
    Start-Sleep -Seconds 2
    
    # Start Backend
    $backendPath = Join-Path (Get-Location) "Backend"
    $service3 = Start-ServiceInNewTerminal -Title "Backend Server" -Command "npm start" -WorkingDirectory $backendPath
    $services += $service3
    Start-Sleep -Seconds 2
    
    # Start Frontend
    $frontendPath = Join-Path (Get-Location) "my-react-app"
    $service4 = Start-ServiceInNewTerminal -Title "Frontend Dev Server" -Command "npm run dev" -WorkingDirectory $frontendPath
    $services += $service4
    
    Write-Host ""
    Write-Host "All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend:          http://localhost:5174" -ForegroundColor White
    Write-Host "   Backend API:       http://localhost:5000" -ForegroundColor White
    Write-Host "   CV Classifier:     http://localhost:5002" -ForegroundColor White
    Write-Host "   Skill Analyzer:    http://localhost:5003" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Open browser: http://localhost:5174" -ForegroundColor White
    Write-Host "   2. Login as Employee" -ForegroundColor White
    Write-Host "   3. Go to Profile page" -ForegroundColor White
    Write-Host "   4. Upload your CV (PDF)" -ForegroundColor White
    Write-Host "   5. Click Classify Job Role button" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop all services, close all the opened terminal windows" -ForegroundColor Yellow
    Write-Host ""
    
    # Keep this window open
    Write-Host "Press any key to view service status..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Write-Host ""
    Write-Host "Service Status:" -ForegroundColor Cyan
    foreach ($service in $services) {
        $status = if ($service.Process.HasExited) { "Stopped" } else { "Running" }
        Write-Host "   $($service.Name): $status" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Keep this window open to monitor services..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to exit (services will continue running)" -ForegroundColor Yellow
    
    # Keep monitoring
    while ($true) {
        Start-Sleep -Seconds 5
    }
    
} else {
    Write-Host "Cancelled." -ForegroundColor Red
}
