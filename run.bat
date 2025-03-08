@echo off
echo ------------------------
echo Starting GiorgosPowerSearch
echo ------------------------

REM Activate the virtual environment if it exists
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Creating one...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo Installing dependencies...
    pip install -r backend/requirements.txt
)

echo ------------------------
echo Starting backend server
echo ------------------------
start cmd /k "cd backend && python app.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo ------------------------
echo Starting frontend server
echo ------------------------
start cmd /k "cd frontend && npm start"

echo ------------------------
echo Both servers are now running!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo ------------------------

echo Press any key to terminate both servers...
pause >nul

REM Kill all server processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1

echo Servers terminated. Thank you for using GiorgosPowerSearch!
timeout /t 2 >nul 