import os
import shutil
import subprocess
import sys
import zipfile
import traceback
from pathlib import Path

# Configuration
APP_NAME = "GiorgosPowerSearch"
VERSION = "1.0.0"
OUTPUT_DIR = "dist"
PORTABLE_DIR = os.path.join("installer", f"{APP_NAME}_Portable")

def clean_dist():
    """Clean the distribution directory"""
    print("Starting clean_dist()")
    if os.path.exists(OUTPUT_DIR):
        print(f"Cleaning {OUTPUT_DIR} directory...")
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Also clean portable directory
    if os.path.exists(PORTABLE_DIR):
        print(f"Cleaning {PORTABLE_DIR} directory...")
        shutil.rmtree(PORTABLE_DIR)
    print("clean_dist() completed")

def build_frontend():
    """Build the React frontend"""
    print("Starting build_frontend()")
    
    # Check if frontend directory exists
    if not os.path.exists("frontend"):
        print("ERROR: frontend directory not found!")
        raise FileNotFoundError("frontend directory not found")
    
    print(f"Changing to frontend directory: {os.path.abspath('frontend')}")
    os.chdir("frontend")
    
    # Install dependencies if needed
    if not os.path.exists("node_modules"):
        print("Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)
    
    # Build the frontend
    print("Building frontend with npm run build...")
    subprocess.run(["npm", "run", "build"], check=True)
    print("Returning to project root...")
    os.chdir("..")
    
    # Copy build files to the dist directory
    print("Copying frontend build files to dist...")
    frontend_build = os.path.join("frontend", "build")
    dist_frontend = os.path.join(OUTPUT_DIR, "frontend")
    
    if os.path.exists(frontend_build):
        print(f"Frontend build directory found at: {os.path.abspath(frontend_build)}")
        if not os.path.exists(dist_frontend):
            os.makedirs(dist_frontend)
        
        # Copy all files from build to dist/frontend
        for item in os.listdir(frontend_build):
            source = os.path.join(frontend_build, item)
            destination = os.path.join(dist_frontend, item)
            print(f"Copying {source} to {destination}")
            
            if os.path.isdir(source):
                if os.path.exists(destination):
                    shutil.rmtree(destination)
                shutil.copytree(source, destination)
            else:
                shutil.copy2(source, destination)
    else:
        print(f"WARNING: Frontend build directory not found at: {os.path.abspath(frontend_build)}")
        
    print("build_frontend() completed")

def package_backend():
    """Package the Python backend with PyInstaller"""
    print("Starting package_backend()")
    
    # Check if backend directory exists
    if not os.path.exists("backend"):
        print("ERROR: backend directory not found!")
        raise FileNotFoundError("backend directory not found")
        
    print(f"Changing to backend directory: {os.path.abspath('backend')}")
    os.chdir("backend")
    
    # Create PyInstaller spec
    print("Running PyInstaller...")
    icon_path = "../app_icon.ico" if os.path.exists("../app_icon.ico") else "app.ico"
    print(f"Using icon: {icon_path}")
    
    try:
        subprocess.run([
            "pyinstaller",
            "--name", f"{APP_NAME}_Backend",
            "--onefile",
            "--noconsole",
            "--add-data", "app;app" if sys.platform == "win32" else "app:app",
            "--icon", icon_path,
            "app.py"
        ], check=True)
    except Exception as e:
        print(f"ERROR running PyInstaller: {str(e)}")
        raise
    
    print("Returning to project root...")
    os.chdir("..")
    
    # Copy backend dist to main dist
    backend_dist = os.path.join("backend", "dist")
    if os.path.exists(backend_dist):
        print(f"Backend dist directory found at: {os.path.abspath(backend_dist)}")
        for file in os.listdir(backend_dist):
            source = os.path.join(backend_dist, file)
            destination = os.path.join(OUTPUT_DIR, file)
            print(f"Copying {source} to {destination}")
            shutil.copy(source, destination)
    else:
        print(f"ERROR: Backend dist directory not found at: {os.path.abspath(backend_dist)}")
        raise FileNotFoundError("backend/dist directory not found")
        
    print("package_backend() completed")

def create_batch_files():
    """Create batch files to run the application"""
    print("Starting create_batch_files()")
    
    # Launcher batch file
    launcher_content = """@echo off
echo Starting GiorgosPowerSearch...

REM Start backend
start "" "%~dp0GiorgosPowerSearch_Backend.exe"

REM Wait for backend to initialize
timeout /t 2 /nobreak > nul

REM Open frontend in browser
start "" "http://localhost:5000"

echo GiorgosPowerSearch is running.
echo Press any key to exit...
pause > nul

REM Kill backend process when closing
taskkill /im GiorgosPowerSearch_Backend.exe /f > nul 2>&1
"""
    
    batch_path = os.path.join(OUTPUT_DIR, f"{APP_NAME}.bat")
    print(f"Creating launcher batch file: {batch_path}")
    with open(batch_path, "w") as f:
        f.write(launcher_content)
    
    # Create a README file
    readme_content = f"""GiorgosPowerSearch v{VERSION}
=========================

A powerful product search tool that searches across multiple e-commerce platforms.

HOW TO RUN:
-----------
1. Double-click on "{APP_NAME}.bat" to start the application
2. The application will open in your default web browser
3. To exit, close the browser and press any key in the console window

REQUIREMENTS:
------------
- Windows 10 or higher
- Internet connection (for accessing online stores)

SUPPORT:
-------
Contact: support@giorgospower.com
"""
    
    readme_path = os.path.join(OUTPUT_DIR, "README.txt")
    print(f"Creating README file: {readme_path}")
    with open(readme_path, "w") as f:
        f.write(readme_content)
        
    print("create_batch_files() completed")

def create_portable_package():
    """Create a portable package with everything needed"""
    print("Starting create_portable_package()")
    
    # Create portable directory
    if not os.path.exists("installer"):
        print("Creating installer directory...")
        os.makedirs("installer")
    
    print(f"Creating portable directory: {PORTABLE_DIR}")
    os.makedirs(PORTABLE_DIR, exist_ok=True)
    
    # Copy all files from dist to portable directory
    print(f"Copying files from {OUTPUT_DIR} to {PORTABLE_DIR}...")
    for item in os.listdir(OUTPUT_DIR):
        source = os.path.join(OUTPUT_DIR, item)
        destination = os.path.join(PORTABLE_DIR, item)
        print(f"Copying {source} to {destination}")
        
        if os.path.isdir(source):
            if os.path.exists(destination):
                shutil.rmtree(destination)
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)
    
    # Copy icon
    if os.path.exists("app_icon.ico"):
        print("Copying app_icon.ico to portable directory...")
        shutil.copy2("app_icon.ico", PORTABLE_DIR)
    
    # Create a shortcut.bat that users can use to create a desktop shortcut
    shortcut_bat = os.path.join(PORTABLE_DIR, "CreateShortcut.bat")
    print(f"Creating shortcut batch file: {shortcut_bat}")
    shortcut_content = f"""@echo off
echo Creating desktop shortcut for GiorgosPowerSearch...

REM Create a shortcut on the desktop
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\{APP_NAME}.lnk'); $Shortcut.TargetPath = '%~dp0{APP_NAME}.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0app_icon.ico,0'; $Shortcut.Description = 'GiorgosPowerSearch Tool'; $Shortcut.Save()"

echo Shortcut created successfully!
echo.
pause
"""
    
    with open(shortcut_bat, "w") as f:
        f.write(shortcut_content)
    
    # Create ZIP file
    zip_path = os.path.join("installer", f"{APP_NAME}_v{VERSION}_Portable.zip")
    print(f"Creating ZIP file: {zip_path}")
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            print(f"Walking directory: {PORTABLE_DIR}")
            for root, dirs, files in os.walk(PORTABLE_DIR):
                print(f"Processing directory: {root} with {len(files)} files")
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, os.path.dirname(PORTABLE_DIR))
                    print(f"Adding to ZIP: {file_path} as {arcname}")
                    zipf.write(file_path, arcname)
    except Exception as e:
        print(f"Error creating ZIP file: {str(e)}")
        raise
    
    print(f"Portable ZIP package created: {zip_path}")
    print("create_portable_package() completed")

def main():
    print(f"=== Packaging {APP_NAME} v{VERSION} ===")
    print(f"Current directory: {os.getcwd()}")
    print(f"Python version: {sys.version}")
    
    try:
        # Clean and prepare
        clean_dist()
        
        # Check backend app.py exists
        if not os.path.exists(os.path.join("backend", "app.py")):
            print("ERROR: backend/app.py not found!")
            return 1
            
        # Build and package components - stop at first error
        print("\n=== Step 1: Building frontend ===")
        build_frontend()
        
        print("\n=== Step 2: Packaging backend ===")
        package_backend()
        
        print("\n=== Step 3: Creating batch files ===")
        create_batch_files()
        
        print("\n=== Step 4: Creating portable package ===")
        create_portable_package()
        
        print("\nPackaging complete!")
        print(f"Portable package: installer/{APP_NAME}_v{VERSION}_Portable.zip")
        print(f"Portable directory: {PORTABLE_DIR}")
        print("\nTo distribute:")
        print(f"1. Share the ZIP file: installer/{APP_NAME}_v{VERSION}_Portable.zip")
        print(f"2. Users can extract the ZIP and run {APP_NAME}.bat")
        print(f"3. Users can create a desktop shortcut by running CreateShortcut.bat")
        
    except Exception as e:
        print(f"Error during packaging: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 