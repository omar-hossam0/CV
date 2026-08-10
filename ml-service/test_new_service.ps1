Write-Host "`n========================================" -ForegroundColor Green
Write-Host "TESTING CV CLASSIFICATION WITH TF-IDF" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Test 1: Full Stack Developer
$body1 = @{
    cv_text = "Senior Full Stack Developer with 5 years experience in Python Django React Node.js AWS. Built REST APIs."
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r1 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body1 -ContentType 'application/json'
    Write-Host "1. Full Stack Developer CV:" -ForegroundColor Cyan
    Write-Host "   Result: $($r1.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r1.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Status: $($r1.confidence_status)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test 1 failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Data Scientist
$body2 = @{
    cv_text = "Data Scientist with machine learning expertise TensorFlow PyTorch pandas numpy scikit-learn building AI models"
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r2 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body2 -ContentType 'application/json'
    Write-Host "2. Data Scientist CV:" -ForegroundColor Cyan
    Write-Host "   Result: $($r2.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r2.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Status: $($r2.confidence_status)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Test 2 failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Green
