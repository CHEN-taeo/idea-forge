@echo off
echo ==========================================
echo   Idea Forge v3.3 - Dev Server Starter
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo Starting Vite dev server...
echo Open http://localhost:5173 in your browser
echo Press Ctrl+C to stop
echo.

npm run dev

pause