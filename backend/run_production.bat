@echo off
echo Starting Giorgos Power Search backend in production mode...

REM Set environment variables
set FLASK_ENV=production
set FLASK_APP=wsgi.py

REM Activate virtual environment if needed
IF EXIST venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Install Waitress if not already installed
pip install waitress

REM Run with Waitress WSGI server
python -m waitress --port=5000 wsgi:application

echo Backend server running on http://localhost:5000 