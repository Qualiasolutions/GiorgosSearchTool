@echo off
echo =============================================
echo Running Giorgos Power Search (Production Mode)
echo =============================================
echo.

REM Check if the frontend build exists
if not exist frontend\build (
    echo ERROR: Frontend build does not exist.
    echo Please run production_build.bat first.
    echo.
    pause
    exit /b 1
)

REM Check if backend virtual environment exists
if not exist backend\venv (
    echo ERROR: Backend environment not set up.
    echo Please run production_build.bat first.
    echo.
    pause
    exit /b 1
)

echo Starting Flask server with production build...
echo.
echo The application will be available at: http://localhost:5000
echo.
cd backend
call venv\Scripts\activate
python app.py

echo.
echo Server shut down.
pause 