# Start CV Classifier Service
# يشغل خدمة تصنيف السير الذاتية

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Starting CV Classifier Service" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# التحقق من أن الخدمة ليست تعمل بالفعل
$existingProcess = Get-NetTCPConnection -LocalPort 5002 -ErrorAction SilentlyContinue

if ($existingProcess) {
    Write-Host "⚠️  Port 5002 is already in use!" -ForegroundColor Yellow
    Write-Host "   Stopping existing service..." -ForegroundColor Yellow
    
    foreach ($conn in $existingProcess) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
}

# الانتقال إلى مجلد الخدمة
Set-Location -Path "$PSScriptRoot\ml-service"

Write-Host "🚀 Starting ML Classifier Service..." -ForegroundColor Cyan
Write-Host "   Location: ml-service/" -ForegroundColor Gray
Write-Host "   Port: 5002" -ForegroundColor Gray
Write-Host "   Model: cv_classifier_merged.keras`n" -ForegroundColor Gray

# تشغيل الخدمة في نافذة منفصلة
Start-Process python -ArgumentList "cv_classifier_service.py" -WorkingDirectory $PWD

Write-Host "⏳ Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 7

# التحقق من أن الخدمة بدأت بنجاح
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5002/health' -TimeoutSec 3
    $health = $response.Content | ConvertFrom-Json
    
    Write-Host "`n✅ Service started successfully!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Keras Model: $(if ($health.keras_model) { '✅ Loaded' } else { '❌ Not Loaded' })" -ForegroundColor White
    Write-Host "   Groq API: $(if ($health.groq_api) { '✅ Available' } else { '⚠️  Not Available' })" -ForegroundColor White
    Write-Host "`n🌐 Service URL: http://localhost:5002" -ForegroundColor Cyan
    Write-Host "📊 Health Check: http://localhost:5002/health" -ForegroundColor Cyan
    Write-Host "🔬 Classify Endpoint: http://localhost:5002/classify" -ForegroundColor Cyan
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host " Service is ready! ✨" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Failed to start service!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if Python is installed: python --version" -ForegroundColor White
    Write-Host "   2. Check if required packages are installed" -ForegroundColor White
    Write-Host "   3. Check if model file exists: cv_classifier_merged.keras" -ForegroundColor White
    Write-Host "   4. Check the terminal output for errors`n" -ForegroundColor White
}
