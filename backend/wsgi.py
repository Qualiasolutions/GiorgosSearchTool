import os
from flask import send_from_directory
from app import create_app

# Create the Flask application for production
app = create_app()

# Add route to serve the React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # If path is an API endpoint, let Flask handle it
    if path.startswith('api/'):
        # Let the request continue to the API routes
        return 
    
    # Check if the requested file exists in the build directory
    build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'build')
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    
    # Otherwise, serve the index.html (for client-side routing)
    return send_from_directory(build_dir, 'index.html')

# This allows running the app with a WSGI server like Gunicorn
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000) 