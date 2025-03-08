@echo off
echo Starting Giorgos' Power Search Tool...
echo.

echo ------------------------
echo Setting up environment
echo ------------------------
cd backend
echo Installing backend dependencies...
pip install -r requirements.txt
echo.

echo ------------------------
echo Starting backend server
echo ------------------------
start cmd /k "cd backend && python app.py"
echo.

echo ------------------------
echo Starting frontend server
echo ------------------------
start cmd /k "cd frontend && npm install && npm start"
echo.

echo Both servers are now running!
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to terminate both servers...
pause
taskkill /F /FI "WINDOWTITLE eq *app.py*"
taskkill /F /FI "WINDOWTITLE eq *npm start*" 