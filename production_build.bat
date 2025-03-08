@echo off
echo ========================================
echo Building Giorgos Power Search Production
echo ========================================

echo 1. Building React frontend...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error building frontend.
    exit /b %ERRORLEVEL%
)

echo 2. Setting up backend environment...
cd ..\backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Error installing backend dependencies.
    exit /b %ERRORLEVEL%
)

echo 3. Production build complete!
echo.
echo To run the application:
echo 1. cd backend
echo 2. venv\Scripts\activate
echo 3. python app.py
echo.
echo Then open http://localhost:5000 in your browser
echo.
pause 