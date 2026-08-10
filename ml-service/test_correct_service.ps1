Write-Host "`n========================================" -ForegroundColor Green
Write-Host "TESTING CV CLASSIFICATION - CORRECT VERSION" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Test 1: Full Stack Developer
Write-Host "Test 1: Full Stack Developer CV" -ForegroundColor Cyan
$body1 = @{
    cv_text = "Senior Full Stack Developer with 5 years experience in Python Django React Node.js AWS. Built REST APIs and microservices. Expert in JavaScript TypeScript MongoDB PostgreSQL."
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r1 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body1 -ContentType 'application/json'
    Write-Host "   Result: $($r1.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r1.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Status: $($r1.confidence_status)" -ForegroundColor Gray
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r1.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Data Scientist
Write-Host "Test 2: Data Scientist CV" -ForegroundColor Cyan
$body2 = @{
    cv_text = "Data Scientist with machine learning expertise. TensorFlow PyTorch pandas numpy scikit-learn. Building AI models for predictive analytics. PhD in Statistics."
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r2 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body2 -ContentType 'application/json'
    Write-Host "   Result: $($r2.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r2.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Status: $($r2.confidence_status)" -ForegroundColor Gray
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r2.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Accountant
Write-Host "Test 3: Accountant CV" -ForegroundColor Cyan
$body3 = @{
    cv_text = "Senior Accountant with CPA certification. 8 years experience in financial reporting, tax preparation, auditing. Expert in QuickBooks, SAP, Excel. Balance sheets and income statements."
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r3 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body3 -ContentType 'application/json'
    Write-Host "   Result: $($r3.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r3.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Status: $($r3.confidence_status)" -ForegroundColor Gray
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r3.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Chef
Write-Host "Test 4: Chef CV" -ForegroundColor Cyan
$body4 = @{
    cv_text = "Executive Chef with 10 years experience. French cuisine specialist. Kitchen management, menu planning, food safety. Worked at Michelin star restaurants. Culinary arts degree."
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r4 = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body4 -ContentType 'application/json'
    Write-Host "   Result: $($r4.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r4.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Status: $($r4.confidence_status)" -ForegroundColor Gray
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r4.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Green
