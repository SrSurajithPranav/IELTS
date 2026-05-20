import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///ielts.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

    # Login approval + email notifications
    # Default OFF — easier developer experience and Codespaces testing
    REQUIRE_LOGIN_APPROVAL = os.getenv('REQUIRE_LOGIN_APPROVAL', 'false').lower() == 'true'
    ADMIN_APPROVER_EMAIL = os.getenv('ADMIN_APPROVER_EMAIL')
    FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:5173')
    BACKEND_BASE_URL = os.getenv('BACKEND_BASE_URL', 'http://localhost:5000')

    SMTP_HOST = os.getenv('SMTP_HOST')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER')
    SMTP_PASS = os.getenv('SMTP_PASS')
    SMTP_FROM = os.getenv('SMTP_FROM', os.getenv('SMTP_USER', 'no-reply@ielts.local'))

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    REQUIRE_LOGIN_APPROVAL = False

class ProductionConfig(Config):
    """Production configuration — requires DATABASE_URL env var (PostgreSQL)."""
    DEBUG = False
    REQUIRE_LOGIN_APPROVAL = False

    @classmethod
    def init_app(cls, app):
        """Validate that critical env vars are set in production."""
        db_url = os.getenv('DATABASE_URL', '')
        if not db_url or 'sqlite' in db_url:
            import warnings
            warnings.warn(
                "⚠️  DATABASE_URL is not set or points to SQLite. "
                "Production should use PostgreSQL (e.g. Supabase).",
                RuntimeWarning,
            )

        # Fix Supabase/Heroku postgres:// → postgresql:// scheme
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
            app.config['SQLALCHEMY_DATABASE_URI'] = db_url

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
