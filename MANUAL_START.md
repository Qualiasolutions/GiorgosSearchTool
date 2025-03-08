# Manual Start Guide for Giorgos' Power Search Tool

If you prefer to start the servers manually or if the automated script doesn't work, follow these steps:

## Starting the Backend Server

1. Open a terminal/PowerShell window
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```
   python app.py
   ```
5. The backend server should start at http://localhost:5000

## Starting the Frontend Server

1. Open a new terminal/PowerShell window (keep the backend terminal running)
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the React development server:
   ```
   npm start
   ```
5. The frontend should automatically open in your browser at http://localhost:3000

## Troubleshooting

If you encounter errors:

1. **OpenAI API errors**: Make sure your API key in the backend/.env file is valid
2. **Module import errors**: Check that all dependencies are installed correctly
3. **Port already in use**: Make sure no other service is using ports 5000 (backend) or 3000 (frontend)
4. **Frontend connection errors**: Verify that the backend server is running before starting the frontend

## Terminating the Servers

1. To stop the servers, press Ctrl+C in each terminal window
2. You might need to press Ctrl+C multiple times to fully terminate the processes 