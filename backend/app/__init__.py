from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configure CORS to allow requests from the frontend domain
    CORS(app, resources={r"/api/*": {"origins": [
        "https://giorgospowersearch-web.onrender.com",
        "http://localhost:3000",
        "http://localhost:5000"
    ]}})
    
    from .routes import main
    app.register_blueprint(main)
    
    return app 