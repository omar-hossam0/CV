# Start Skill Matcher API
Write-Host "🚀 Starting Skill Matcher API..." -ForegroundColor Cyan
Write-Host "📂 Directory: last-one" -ForegroundColor Yellow

# Stop any existing Python processes
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Change to last-one directory and start the API
Set-Location last-one
python skill_matcher_api.py
