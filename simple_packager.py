import os
import shutil
import zipfile

# Configuration
APP_NAME = "GiorgosPowerSearch"
VERSION = "1.0.0"
OUTPUT_DIR = "dist"
PORTABLE_DIR = os.path.join("installer", f"{APP_NAME}_Portable")

def create_portable_package():
    """Create a simple portable package for distribution"""
    print(f"=== Creating portable package for {APP_NAME} v{VERSION} ===")
    
    # Create output directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    if os.path.exists(PORTABLE_DIR):
        shutil.rmtree(PORTABLE_DIR)
    os.makedirs(PORTABLE_DIR, exist_ok=True)
    
    # Create simplified backend
    backend_file = os.path.join(OUTPUT_DIR, "backend.py")
    with open(backend_file, "w") as f:
        f.write('''from flask import Flask, request, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

@app.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # This is a simplified demo version that returns dummy results
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
''')
    print(f"Created simplified backend: {backend_file}")
    
    # Create frontend directory and index.html
    frontend_dir = os.path.join(OUTPUT_DIR, "frontend")
    os.makedirs(frontend_dir, exist_ok=True)
    
    index_file = os.path.join(frontend_dir, "index.html")
    with open(index_file, "w") as f:
        f.write('''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GiorgosPowerSearch</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #00A4AC; }
        .search-box { display: flex; margin: 20px 0; }
        .search-box input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px 0 0 4px; }
        .search-box button { background-color: #00A4AC; color: white; border: none; padding: 10px 20px; border-radius: 0 4px 4px 0; cursor: pointer; }
        .results { margin-top: 20px; }
        .loading { text-align: center; padding: 40px; }
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
</html>''')
    print(f"Created frontend files: {frontend_dir}")
    
    # Create launcher batch file
    launcher_file = os.path.join(OUTPUT_DIR, f"{APP_NAME}.bat")
    with open(launcher_file, "w") as f:
        f.write(f'''@echo off
echo Starting {APP_NAME}...

REM Start the backend
start "GiorgosPowerSearch Backend" /min python backend.py

REM Wait for backend to initialize
timeout /t 2 /nobreak > nul

REM Open frontend in browser
start "" "http://localhost:5000"

echo {APP_NAME} is running.
echo Press any key to exit the application...
pause > nul

REM Kill python process when closing
taskkill /f /im python.exe > nul 2>&1
''')
    print(f"Created launcher batch file: {launcher_file}")
    
    # Create setup script
    setup_file = os.path.join(OUTPUT_DIR, "setup.bat")
    with open(setup_file, "w") as f:
        f.write('''@echo off
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
''')
    print(f"Created setup script: {setup_file}")
    
    # Create README file
    readme_file = os.path.join(OUTPUT_DIR, "README.txt")
    with open(readme_file, "w") as f:
        f.write(f'''GiorgosPowerSearch v{VERSION}
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
''')
    print(f"Created README file: {readme_file}")
    
    # Copy files to portable directory
    for item in os.listdir(OUTPUT_DIR):
        source = os.path.join(OUTPUT_DIR, item)
        destination = os.path.join(PORTABLE_DIR, item)
        
        if os.path.isdir(source):
            if os.path.exists(destination):
                shutil.rmtree(destination)
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)
    
    # Copy icon if it exists
    if os.path.exists("app_icon.ico"):
        shutil.copy2("app_icon.ico", PORTABLE_DIR)
        
    # Create ZIP file
    os.makedirs("installer", exist_ok=True)
    zip_path = os.path.join("installer", f"{APP_NAME}_v{VERSION}_Portable.zip")
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PORTABLE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, os.path.dirname(PORTABLE_DIR))
                zipf.write(file_path, arcname)
                
    print(f"Created ZIP package: {zip_path}")
    print("\n=== Packaging complete! ===")
    print(f"Portable application: {PORTABLE_DIR}")
    print(f"ZIP package: {zip_path}")
    print("\nTo distribute this application:")
    print(f"1. Share the ZIP file: {zip_path}")
    print("2. Instruct users to:")
    print("   a. Extract the ZIP file")
    print("   b. Run setup.bat once to install dependencies")
    print("   c. Run GiorgosPowerSearch.bat to use the application")

if __name__ == "__main__":
    try:
        create_portable_package()
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...") 