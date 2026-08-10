Write-Host "`n========================================" -ForegroundColor Green
Write-Host " COMPREHENSIVE CV CLASSIFICATION TEST" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$tests = @(
    @{name="Accountant"; text="Experienced Accountant with CPA certification 8 years financial reporting tax preparation auditing QuickBooks SAP"},
    @{name="Chef"; text="Executive Chef 10 years French cuisine kitchen management menu planning food safety Michelin star culinary arts"},
    @{name="Java Developer"; text="Java Developer Spring Boot Maven Hibernate JPA MySQL Enterprise applications REST API microservices"},
    @{name="Python Developer"; text="Python Developer Django Flask FastAPI backend development REST APIs PostgreSQL Redis Docker Kubernetes"},
    @{name="Web Developer"; text="Web Developer HTML CSS JavaScript React Vue Angular TypeScript responsive design frontend UX UI"},
    @{name="HR Professional"; text="HR Manager recruitment employee relations performance management training compensation benefits HRIS"},
    @{name="Engineer"; text="Mechanical Engineer CAD SolidWorks manufacturing product design prototyping testing quality control"},
    @{name="Sales Manager"; text="Sales Manager B2B business development account management CRM pipeline negotiation closing deals revenue growth"}
)

$results = @()

foreach($test in $tests) {
    Write-Host "Testing: $($test.name)" -ForegroundColor Cyan
    
    $body = @{
        cv_text = $test.text
        use_groq_analysis = $false
    } | ConvertTo-Json -Compress
    
    try {
        $r = Invoke-RestMethod -Uri 'http://localhost:5002/classify' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 10
        
        $confidence = [math]::Round($r.confidence * 100, 1)
        $status = if ($confidence -ge 50) { "GOOD" } elseif ($confidence -ge 30) { "OK" } else { "LOW" }
        
        Write-Host "  Result: $($r.job_title)" -ForegroundColor White
        Write-Host "  Confidence: $confidence% [$status]" -ForegroundColor $(if($confidence -ge 50){"Green"}elseif($confidence -ge 30){"Yellow"}else{"Red"})
        
        $results += @{
            Input = $test.name
            Predicted = $r.job_title
            Confidence = $confidence
            Status = $status
        }
        
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            Input = $test.name
            Predicted = "ERROR"
            Confidence = 0
            Status = "FAIL"
        }
    }
    Write-Host ""
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " SUMMARY" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$goodCount = ($results | Where-Object { $_.Status -eq "GOOD" }).Count
$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$lowCount = ($results | Where-Object { $_.Status -eq "LOW" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "Total Tests: $($results.Count)"
Write-Host "GOOD (>50%): $goodCount" -ForegroundColor Green
Write-Host "OK (30-50%): $okCount" -ForegroundColor Yellow
Write-Host "LOW (<30%): $lowCount" -ForegroundColor Red
Write-Host "FAILED: $failCount" -ForegroundColor Red

Write-Host "`n========================================`n" -ForegroundColor Green
