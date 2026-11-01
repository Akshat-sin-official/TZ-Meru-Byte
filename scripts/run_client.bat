@echo off
cd /d "%~dp0.."
title CIT CampusOS UI (Vite)
echo Starting React Vite UI on http://localhost:5173...
cd client
npm run dev
pause
