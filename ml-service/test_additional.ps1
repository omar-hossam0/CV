Write-Host "`n========================================" -ForegroundColor Green
Write-Host "ADDITIONAL TESTS" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Test Python Developer
Write-Host "Test: Python Developer CV" -ForegroundColor Cyan
$body = @{
    cv_text = "Python Developer with 5 years experience in Django Flask FastAPI. Backend development REST APIs microservices PostgreSQL Redis Docker AWS"
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body -ContentType 'application/json'
    Write-Host "   Result: $($r.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test Web Developer
Write-Host "Test: Web Developer CV" -ForegroundColor Cyan
$body = @{
    cv_text = "Web Developer HTML CSS JavaScript React Vue Angular TypeScript responsive design frontend development user interface UX UI"
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body -ContentType 'application/json'
    Write-Host "   Result: $($r.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test Java Developer
Write-Host "Test: Java Developer CV" -ForegroundColor Cyan
$body = @{
    cv_text = "Java Developer Spring Boot Maven Hibernate JPA MySQL Oracle Enterprise applications microservices REST API development"
    use_groq_analysis = $false
} | ConvertTo-Json -Compress

try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body -ContentType 'application/json'
    Write-Host "   Result: $($r.job_title)" -ForegroundColor White
    Write-Host "   Confidence: $([math]::Round($r.confidence * 100, 1))%" -ForegroundColor Yellow
    Write-Host "   Top 3:" -ForegroundColor Magenta
    foreach($p in $r.top_3_predictions) {
        Write-Host "      - $($p.job_title): $([math]::Round($p.confidence * 100, 1))%" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Green
