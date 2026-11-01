@echo off
cd /d "%~dp0"
title Campora Master Launcher
echo ===================================================
echo  Starting Campora Full Stack Platform
echo ===================================================

start "CIT Optimizer" cmd /k "run_optimizer.bat"
timeout /t 3 /nobreak >nul

start "CIT Server" cmd /k "run_server.bat"
timeout /t 3 /nobreak >nul

start "CIT Client" cmd /k "run_client.bat"

echo.
echo All services launched!
echo Optimizer: http://127.0.0.1:8001
echo Server:    http://localhost:5000
echo UI:        http://localhost:5173
echo.
pause
