Write-Host "Starting Giorgos' Power Search Tool..." -ForegroundColor Green

Write-Host "`n--------------------------" -ForegroundColor Cyan
Write-Host "Setting up Backend Server" -ForegroundColor Cyan
Write-Host "--------------------------" -ForegroundColor Cyan

Set-Location -Path ".\backend"
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "`nStarting backend server..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "python" -ArgumentList "app.py" -PassThru

Write-Host "`n---------------------------" -ForegroundColor Cyan
Write-Host "Setting up Frontend Server" -ForegroundColor Cyan 
Write-Host "---------------------------" -ForegroundColor Cyan

Set-Location -Path "..\frontend"
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`nStarting frontend server..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru

Write-Host "`nBoth servers are now running!" -ForegroundColor Green
Write-Host "- Backend: http://localhost:5000" -ForegroundColor Magenta
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Magenta

Write-Host "`nPress Enter to terminate both servers..." -ForegroundColor Red
$null = Read-Host

Write-Host "Stopping servers..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force
Stop-Process -Id $frontendProcess.Id -Force
Write-Host "Servers stopped." -ForegroundColor Green 