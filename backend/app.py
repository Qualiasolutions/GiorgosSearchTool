from app import create_app
import os
from dotenv import load_dotenv
from flask import send_from_directory, abort
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = create_app()
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for API routes

# Configure to serve the React build files in production
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # If path is an API endpoint, let Flask's normal routing handle it
    if path.startswith('api/'):
        # Just return None to let Flask continue to the next matching route
        return None
    
    build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'build')
    
    # Handle special case for manifest.json
    if path == 'manifest.json' and os.path.exists(os.path.join(build_dir, 'manifest.json')):
        return send_from_directory(build_dir, 'manifest.json')
        
    # Handle static files (JS, CSS, images)
    if path.startswith('static/'):
        file_path = os.path.join(build_dir, path)
        directory = os.path.dirname(file_path)
        filename = os.path.basename(file_path)
        if os.path.exists(file_path):
            return send_from_directory(directory, filename)
    
    # Check if the file exists in the build directory
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        try:
            return send_from_directory(build_dir, path)
        except Exception as e:
            app.logger.error(f"Error serving file {path}: {str(e)}")
            abort(404)
    
    # Otherwise, serve index.html for client-side routing
    return send_from_directory(build_dir, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False) # Set debug=False for production 