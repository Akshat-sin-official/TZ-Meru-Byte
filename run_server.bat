@echo off
cd /d "%~dp0"
title Campora API Gateway (Node.js)
echo Starting Node.js API Gateway on http://localhost:5000...
cd server
npm run dev
pause
