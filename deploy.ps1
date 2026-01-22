Write-Host "🚀 Fraud Detection App Deployment Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Step 1: Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location server
python -m venv venv
& ".\venv\Scripts\Activate.ps1"

Write-Host ""
Write-Host "Step 2: Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Step 3: Setting up Node.js dependencies..." -ForegroundColor Yellow
Set-Location ..
Set-Location client
npm install

Write-Host ""
Write-Host "Step 4: Building frontend..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "✅ Local setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up Neon database at https://neon.tech" -ForegroundColor White
Write-Host "2. Deploy backend to Render at https://render.com" -ForegroundColor White
Write-Host "3. Deploy frontend to Vercel at https://vercel.com" -ForegroundColor White
Write-Host ""
Write-Host "Follow the detailed guide in TODO.md for deployment instructions." -ForegroundColor White

Read-Host "Press Enter to exit"
