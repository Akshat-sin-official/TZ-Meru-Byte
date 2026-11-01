@echo off
cd /d "%~dp0.."
title CIT CampusOS Master Launcher
echo ===================================================
echo  Starting CIT CampusOS Full Stack Platform
echo ===================================================

start "CIT Optimizer" cmd /k "%~dp0run_optimizer.bat"
timeout /t 3 /nobreak >nul

start "CIT Server" cmd /k "%~dp0run_server.bat"
timeout /t 3 /nobreak >nul

start "CIT Client" cmd /k "%~dp0run_client.bat"

echo.
echo All services launched!
echo Optimizer: http://127.0.0.1:8001
echo Server:    http://localhost:5000
echo UI:        http://localhost:5173
echo.
pause
