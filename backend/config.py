import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
    DEBUG = False
    TESTING = False
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    # Production-specific settings
    pass
    
class TestingConfig(Config):
    TESTING = True
    
# Set configuration based on environment
config_dict = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        return config_dict['production']
    elif env == 'testing':
        return config_dict['testing']
    else:
        return config_dict['development'] 