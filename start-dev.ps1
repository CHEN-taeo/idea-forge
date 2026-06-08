# Idea Forge v3.3 - Dev Server Starter
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Idea Forge v3.3 - Dev Server Starter" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Starting Vite dev server..." -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev

Read-Host "Press Enter to exit"