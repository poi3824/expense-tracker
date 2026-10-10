@echo off
rem Gagyebu launcher: starts backend + frontend and opens the browser

start "Gagyebu Backend" /d "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --reload"
start "Gagyebu Frontend" /d "%~dp0frontend" cmd /k "npm run dev"

echo Starting servers... opening browser in 5 seconds.
timeout /t 5 /nobreak >nul
start "" http://localhost:5173
