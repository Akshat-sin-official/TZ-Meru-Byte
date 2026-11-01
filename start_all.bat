@echo off
title Campora Master Launcher
echo ===================================================
echo  Starting Campora Full Stack Platform
echo ===================================================

start "CIT Optimizer" cmd /c "run_optimizer.bat"
timeout /t 3 /nobreak >nul

start "CIT Server" cmd /c "run_server.bat"
timeout /t 3 /nobreak >nul

start "CIT Client" cmd /c "run_client.bat"

echo.
echo All services launched!
echo Optimizer: http://127.0.0.1:8001
echo Server:    http://localhost:5000
echo UI:        http://localhost:5173
echo.
pause

