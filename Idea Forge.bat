@echo off
title Idea Forge
cd /d "%~dp0"
echo.
echo ========================================
echo   Idea Forge
echo   Starting server + opening app...
echo ========================================
echo.
start "" http://localhost:3001
node --env-file=.env server.js
pause
