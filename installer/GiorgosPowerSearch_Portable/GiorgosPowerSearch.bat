@echo off
echo Starting GiorgosPowerSearch...

REM Start the backend
start "GiorgosPowerSearch Backend" /min python backend.py

REM Wait for backend to initialize
timeout /t 2 /nobreak > nul

REM Open frontend in browser
start "" "http://localhost:5000"

echo GiorgosPowerSearch is running.
echo Press any key to exit the application...
pause > nul

REM Kill python process when closing
taskkill /f /im python.exe > nul 2>&1
