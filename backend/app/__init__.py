from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS to allow all origins
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    from .routes import main
    app.register_blueprint(main)
    
    return app 