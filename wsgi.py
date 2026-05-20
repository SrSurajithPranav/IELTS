import os
from app import create_app

# WSGI entrypoint for Gunicorn/Render
# Gunicorn imports this module and uses the bare 'app' object
config_name = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name)
