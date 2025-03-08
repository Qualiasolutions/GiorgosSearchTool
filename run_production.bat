@echo off
echo Starting Giorgos Power Search in production mode...
echo.

REM Check if npx is available
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npx not found. Please install Node.js.
    exit /b 1
)

REM Start the backend in one window
start cmd /c "cd backend && run_production.bat"
echo Backend starting on http://localhost:5000

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start the frontend in another window
start cmd /c "cd frontend && npx serve -s build -l 3000"
echo Frontend starting on http://localhost:3000

echo.
echo Giorgos Power Search is now running!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill the servers when done
taskkill /f /im waitress* >nul 2>nul
taskkill /f /im node* >nul 2>nul

echo All servers stopped. 