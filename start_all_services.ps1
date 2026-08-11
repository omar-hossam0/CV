# Run All Services - CV Project
# This script starts all services needed for the CV Matching Platform

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
Write-Host "   1. Backend Server (Node.js) - Port 5000" -ForegroundColor White
Write-Host "   2. Model 1 - CV-Job Matcher (Python) - Port 5001" -ForegroundColor White
Write-Host "   3. Model 2 - CV Classifier (Python) - Port 5002" -ForegroundColor White
Write-Host "   4. Model 3 - Skill Analyzer (Python) - Port 5003" -ForegroundColor White
Write-Host "   5. Model 4 - Chat Model (Python) - Port 5004" -ForegroundColor White
Write-Host "   6. Frontend (React) - Port 5174" -ForegroundColor White
Write-Host ""

$start = Read-Host "Start all services? (Y/n)"

if ($start -eq "" -or $start -eq "Y" -or $start -eq "y") {
    
    Write-Host ""
    Write-Host "Starting services..." -ForegroundColor Cyan
    Write-Host ""
    
    # Start Backend
    $backendPath = Join-Path (Get-Location) "Backend"
    $service1 = Start-ServiceInNewTerminal -Title "Backend Server" -Command "npm start" -WorkingDirectory $backendPath
    $services += $service1
    Start-Sleep -Seconds 2
    
    # Start Model 1 (CV-Job Matcher)
    $model1Path = Join-Path (Get-Location) "model-1-cv-matcher"
    $service2 = Start-ServiceInNewTerminal -Title "Model 1 - CV-Job Matcher" -Command "python cv_job_matcher.py" -WorkingDirectory $model1Path
    $services += $service2
    Start-Sleep -Seconds 2
    
    # Start Model 2 (CV Classifier)
    $model2Path = Join-Path (Get-Location) "model-2-cv-classifier"
    $service3 = Start-ServiceInNewTerminal -Title "Model 2 - CV Classifier" -Command "python cv_classifier.py" -WorkingDirectory $model2Path
    $services += $service3
    Start-Sleep -Seconds 2
    
    # Start Model 3 (Skill Analyzer)
    $model3Path = Join-Path (Get-Location) "model-3-skill-analyzer"
    $service4 = Start-ServiceInNewTerminal -Title "Model 3 - Skill Analyzer" -Command "python skill_analyzer.py" -WorkingDirectory $model3Path
    $services += $service4
    Start-Sleep -Seconds 2
    
    # Start Model 4 (Chat Model)
    $model4Path = Join-Path (Get-Location) "model-4-chat-model"
    $service5 = Start-ServiceInNewTerminal -Title "Model 4 - Chat Model" -Command "python chat_model.py" -WorkingDirectory $model4Path
    $services += $service5
    Start-Sleep -Seconds 2
    
    # Start Frontend
    $frontendPath = Join-Path (Get-Location) "Frontend"
    $service6 = Start-ServiceInNewTerminal -Title "Frontend Dev Server" -Command "npm run dev" -WorkingDirectory $frontendPath
    $services += $service6
    
    Write-Host ""
    Write-Host "All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service URLs:" -ForegroundColor Cyan
    Write-Host "   Backend API:       http://localhost:5000" -ForegroundColor White
    Write-Host "   Model 1:           http://localhost:5001" -ForegroundColor White
    Write-Host "   Model 2:           http://localhost:5002" -ForegroundColor White
    Write-Host "   Model 3:           http://localhost:5003" -ForegroundColor White
    Write-Host "   Model 4:           http://localhost:5004" -ForegroundColor White
    Write-Host "   Frontend:          http://localhost:5174" -ForegroundColor White
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
