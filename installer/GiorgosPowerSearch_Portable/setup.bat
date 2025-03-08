@echo off
echo Setting up GiorgosPowerSearch...

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in the PATH.
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
pip install flask

echo Setup complete!
echo.
echo You can now run GiorgosPowerSearch.bat to start the application.
pause
