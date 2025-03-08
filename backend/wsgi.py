from app import create_app

# Create the Flask application for production
application = create_app()

# This allows running the app with a WSGI server like Gunicorn
if __name__ == "__main__":
    application.run() 