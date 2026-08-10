Write-Host "`n========================================" -ForegroundColor Green
Write-Host "TESTING CV CLASSIFICATION" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Test 1: Full Stack Developer
$body1 = @{ 
    cv_text           = "Senior Full Stack Developer with 5 years experience in Python Django React Node.js AWS. Built REST APIs and cloud services." 
    use_groq_analysis = $false 
} | ConvertTo-Json -Compress

$r1 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body1 -ContentType 'application/json'
Write-Host "1. Full Stack Developer CV:" -ForegroundColor Cyan
Write-Host "   Result: $($r1.job_title)" -ForegroundColor White
Write-Host "   Confidence: $([math]::Round($r1.confidence * 100, 1))%" -ForegroundColor Yellow
Write-Host "   Method: $($r1.decision_method)`n" -ForegroundColor Gray

# Test 2: Data Scientist
$body2 = @{ 
    cv_text           = "Data Scientist expert in machine learning deep learning TensorFlow PyTorch pandas numpy scikit-learn. Building AI models and predictive analytics." 
    use_groq_analysis = $false 
} | ConvertTo-Json -Compress

$r2 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body2 -ContentType 'application/json'
Write-Host "2. Data Scientist CV:" -ForegroundColor Cyan
Write-Host "   Result: $($r2.job_title)" -ForegroundColor White
Write-Host "   Confidence: $([math]::Round($r2.confidence * 100, 1))%" -ForegroundColor Yellow
Write-Host "   Method: $($r2.decision_method)`n" -ForegroundColor Gray

# Test 3: Frontend Developer
$body3 = @{ 
    cv_text           = "Frontend Developer specialized in React Vue Angular JavaScript TypeScript HTML CSS. Creating beautiful responsive web interfaces." 
    use_groq_analysis = $false 
} | ConvertTo-Json -Compress

$r3 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body3 -ContentType 'application/json'
Write-Host "3. Frontend Developer CV:" -ForegroundColor Cyan
Write-Host "   Result: $($r3.job_title)" -ForegroundColor White
Write-Host "   Confidence: $([math]::Round($r3.confidence * 100, 1))%" -ForegroundColor Yellow
Write-Host "   Method: $($r3.decision_method)`n" -ForegroundColor Gray

Write-Host "========================================`n" -ForegroundColor Green
