@echo off
cd /d "%~dp0"
title Campora Optimizer (Python FastAPI)
echo Starting Python Optimization Service on http://127.0.0.1:8001...
if exist optimizer\venv\Scripts\python.exe (
    optimizer\venv\Scripts\python.exe -m optimizer.main
) else (
    python -m optimizer.main
)
pause
