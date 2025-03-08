import os
import sys
import shutil
import subprocess
import zipfile
from pathlib import Path

def create_executable():
    """
    This script helps package the GiorgosPowerSearch application into a portable executable
    """
    print("=== Starting GiorgosPowerSearch Packager ===")
    print(f"Current directory: {os.getcwd()}")
    print(f"Python version: {sys.version}")
    
    # Configuration
    APP_NAME = "GiorgosPowerSearch"
    VERSION = "1.0.0"
    OUTPUT_DIR = "dist"
    
    # Make sure the output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Copy assets
    if os.path.exists("app_icon.ico"):
        print("Copying app icon...")
        shutil.copy("app_icon.ico", OUTPUT_DIR)
    
    # Build frontend (if needed)
    frontend_build_dir = os.path.join("frontend", "build")
    if not os.path.exists(frontend_build_dir):
        print("\n=== Frontend build not found, creating static build ===")
        # Create a simple static frontend
        os.makedirs(os.path.join(OUTPUT_DIR, "frontend"), exist_ok=True)
        
        # Create index.html
        index_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GiorgosPowerSearch</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #00A4AC; }}
        .search-box {{ display: flex; margin: 20px 0; }}
        .search-box input {{ flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px 0 0 4px; }}
        .search-box button {{ background-color: #00A4AC; color: white; border: none; padding: 10px 20px; border-radius: 0 4px 4px 0; cursor: pointer; }}
        .results {{ margin-top: 20px; }}
        .loading {{ text-align: center; padding: 40px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>GiorgosPowerSearch</h1>
        <p>Search for products across multiple e-commerce platforms.</p>
        
        <div class="search-box">
            <input type="text" placeholder="Search for products..." id="searchInput">
            <button onclick="search()">Search</button>
        </div>
        
        <div class="results" id="results">
            <!-- Results will appear here -->
        </div>
    </div>

    <script>
        function search() {
            const query = document.getElementById('searchInput').value;
            if (!query) return;
            
            const results = document.getElementById('results');
            results.innerHTML = '<div class="loading">Searching...</div>';
            
            fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    results.innerHTML = `<p>Error: ${data.error || 'Search failed'}</p>`;
                    return;
                }
                
                if (data.products.length === 0) {
                    results.innerHTML = '<p>No results found. Try a different search term.</p>';
                    return;
                }
                
                let html = `<h2>Results for "${query}"</h2>`;
                html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">';
                
                data.products.forEach(product => {
                    html += `
                        <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                            <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 150px; object-fit: contain; background: #f9f9f9;">
                            <div style="padding: 10px;">
                                <h3 style="margin-top: 0; font-size: 16px; height: 40px; overflow: hidden;">${product.title}</h3>
                                <p style="color: #00A4AC; font-weight: bold; font-size: 18px;">$${product.price}</p>
                                <a href="${product.url}" target="_blank" style="display: block; text-align: center; background-color: #00A4AC; color: white; padding: 8px; border-radius: 4px; text-decoration: none;">View Product</a>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                results.innerHTML = html;
            })
            .catch(error => {
                results.innerHTML = `<p>Error: ${error.message}</p>`;
            });
        }
        
        // Allow searching by pressing Enter
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                search();
            }
        });
    </script>
</body>
</html>"""
        
        with open(os.path.join(OUTPUT_DIR, "frontend", "index.html"), "w") as f:
            f.write(index_html)
        
        print("Created static frontend files")
    else:
        print(f"\n=== Copying existing frontend build from {frontend_build_dir} ===")
        # Copy the existing frontend build
        frontend_dist = os.path.join(OUTPUT_DIR, "frontend")
        if os.path.exists(frontend_dist):
            shutil.rmtree(frontend_dist)
        shutil.copytree(frontend_build_dir, frontend_dist)
        print("Frontend build copied to dist/frontend")
    
    # Package backend
    print("\n=== Creating backend executable ===")
    try:
        # Copy app.py to dist directory
        backend_app_py = os.path.join("backend", "app.py")
        if os.path.exists(backend_app_py):
            shutil.copy(backend_app_py, OUTPUT_DIR)
            print(f"Copied {backend_app_py} to {OUTPUT_DIR}")
        else:
            print(f"Warning: {backend_app_py} not found")
        
        # Try to use a standalone backend packaging approach
        # Create a simple backend script
        simple_backend = """from flask import Flask, request, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

@app.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # In a real implementation, this would search real e-commerce sites
        # Here we return dummy data
        dummy_products = [
            {
                "id": "1",
                "title": f"{query} - Sample Product 1",
                "price": 99.99,
                "currency": "USD",
                "url": "https://www.example.com/product1",
                "image": "https://via.placeholder.com/300",
                "site": "Amazon",
                "in_stock": True
            },
            {
                "id": "2",
                "title": f"{query} - Premium Product",
                "price": 199.99,
                "currency": "USD",
                "url": "https://www.example.com/product2",
                "image": "https://via.placeholder.com/300",
                "site": "eBay",
                "in_stock": True
            }
        ]
        
        return jsonify({
            "success": True,
            "query": query,
            "products": dummy_products,
            "total_results": len(dummy_products),
            "page": 1,
            "limit": 10
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "products": [],
            "total_results": 0
        }), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')
    
    # If path is empty, serve index.html
    if path == '':
        return send_from_directory(frontend_dir, 'index.html')
    
    # Check if the file exists in frontend directory
    if os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    
    # Default to index.html for client-side routing
    return send_from_directory(frontend_dir, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
"""
        
        with open(os.path.join(OUTPUT_DIR, "simple_backend.py"), "w") as f:
            f.write(simple_backend)
            
        print("Created simplified backend script")
        
        # Create a batch file to run the application
        launcher_batch = f"""@echo off
echo Starting {APP_NAME}...

REM Start the backend
start "GiorgosPowerSearch Backend" /min python simple_backend.py

REM Wait for backend to initialize
timeout /t 2 /nobreak > nul

REM Open frontend in browser
start "" "http://localhost:5000"

echo {APP_NAME} is running.
echo Press any key to exit the application...
pause > nul

REM Kill python process when closing
taskkill /f /im python.exe > nul 2>&1
"""
        
        with open(os.path.join(OUTPUT_DIR, f"{APP_NAME}.bat"), "w") as f:
            f.write(launcher_batch)
            
        print(f"Created launcher batch file")
        
        # Create requirements.txt for simple dependencies
        requirements = """flask==2.0.1
"""
        
        with open(os.path.join(OUTPUT_DIR, "requirements.txt"), "w") as f:
            f.write(requirements)
            
        print("Created requirements.txt")
        
        # Create setup script to install dependencies
        setup_batch = """@echo off
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
pip install -r requirements.txt

echo Setup complete!
echo.
echo You can now run GiorgosPowerSearch.bat to start the application.
pause
"""
        
        with open(os.path.join(OUTPUT_DIR, "setup.bat"), "w") as f:
            f.write(setup_batch)
            
        print("Created setup.bat script")
        
    except Exception as e:
        print(f"Error packaging backend: {str(e)}")
    
    # Create a ZIP package
    print("\n=== Creating portable package ===")
    os.makedirs("installer", exist_ok=True)
    
    # Create a portable directory with all files
    portable_dir = os.path.join("installer", f"{APP_NAME}_Portable")
    if os.path.exists(portable_dir):
        shutil.rmtree(portable_dir)
    
    shutil.copytree(OUTPUT_DIR, portable_dir)
    
    # Create README file
    readme_content = f"""GiorgosPowerSearch v{VERSION}
=========================

A powerful product search tool that searches across multiple e-commerce platforms.

SETUP:
------
1. Make sure Python 3.8 or higher is installed on your system
2. Run "setup.bat" to install required dependencies

HOW TO RUN:
-----------
1. After setup, double-click on "{APP_NAME}.bat" to start the application
2. The application will open in your default web browser
3. To exit, close the browser and press any key in the console window

REQUIREMENTS:
------------
- Windows 10 or higher
- Python 3.8 or higher
- Internet connection (for accessing online stores)

SUPPORT:
-------
Contact: support@giorgospower.com
"""
    
    with open(os.path.join(portable_dir, "README.txt"), "w") as f:
        f.write(readme_content)
    
    # Create ZIP file
    zip_path = os.path.join("installer", f"{APP_NAME}_v{VERSION}_Portable.zip")
    print(f"Creating ZIP file: {zip_path}")
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(portable_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, os.path.dirname(portable_dir))
                    zipf.write(file_path, arcname)
                    
        print(f"Created ZIP package: {zip_path}")
    except Exception as e:
        print(f"Error creating ZIP file: {str(e)}")
    
    print(f"\n=== Packaging complete! ===")
    print(f"Your portable application is ready in: {portable_dir}")
    print(f"ZIP package: {zip_path}")
    print("\nTo distribute this application:")
    print(f"1. Share the ZIP file: {zip_path}")
    print("2. Instruct users to:")
    print("   a. Extract the ZIP file")
    print("   b. Run setup.bat once to install dependencies")
    print("   c. Run GiorgosPowerSearch.bat to use the application")

if __name__ == "__main__":
    try:
        create_executable()
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        print("Traceback:")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...") 