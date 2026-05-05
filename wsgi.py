import os
from app import create_app

# WSGI entrypoint for Gunicorn/Render
# When running under Gunicorn, this module is imported and 'app' is used directly
# Do NOT add if __name__ == '__main__' - Gunicorn expects bare module-level 'app'
config_name = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name)
