from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Flasgger
import os
from werkzeug.security import generate_password_hash
from config import config

# Import models
from models.db import db
from models.user import User
from models.plan import Plan
from models.task import Task
from models.student_plan import StudentPlan
from models.submission import Submission
from models.batch import Batch, BatchMember

# Import blueprints
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.submissions import submissions_bp
from routes.feedback import feedback_bp
from routes.plans import plans_bp
from routes.users import users_bp
from routes.batches import batches_bp

def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize Swagger UI with proper config
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/apispec.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/",
        "title": "IELTS API",
        "version": "1.0.0",
        "description": "IELTS Training Platform API",
        "termsOfService": "",
        "contact": {
            "email": "support@ielts.com"
        }
    }
    
    Flasgger(
        app,
        config=swagger_config,
        template={
            "definitions": {},
            "securityDefinitions": {
                "Bearer": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
                }
            }
        }
    )
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(submissions_bp, url_prefix='/api/submissions')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    app.register_blueprint(plans_bp, url_prefix='/api/plans')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(batches_bp, url_prefix='/api/batches')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        """
        Health check endpoint
        ---
        tags:
          - System
        responses:
          200:
            description: Server is healthy
        """
        return {'status': 'healthy'}, 200
    
    # Create tables
    with app.app_context():
        db.create_all()

        # Keep the demo credentials stable in development so the frontend
        # can always log in without requiring a separate seed step.
        if config_name == 'development':
            from models.user import User

            demo_users = [
                {
                    'name': 'Arjun Kumar',
                    'email': 'student@ielts.com',
                    'password': '123',
                    'role': 'student',
                    'score': 68,
                    'streak': 7,
                    'weak_areas': 'Writing Task 1,Listening Section 3',
                },
                {
                    'name': 'Ms. Kavitha',
                    'email': 'teacher@ielts.com',
                    'password': '123',
                    'role': 'admin',
                    'score': 0,
                    'streak': 0,
                    'weak_areas': '',
                },
                {
                    'name': 'Admin User',
                    'email': 'admin@ielts.com',
                    'password': 'admin123',
                    'role': 'admin',
                    'score': 0,
                    'streak': 0,
                    'weak_areas': '',
                },
            ]

            for demo_user in demo_users:
                user = User.query.filter_by(email=demo_user['email']).first()
                password_hash = generate_password_hash(demo_user['password'])
                if user:
                    user.name = demo_user['name']
                    user.password = password_hash
                    user.role = demo_user['role']
                    user.score = demo_user['score']
                    user.streak = demo_user['streak']
                    user.weak_areas = demo_user['weak_areas']
                else:
                    db.session.add(User(
                        name=demo_user['name'],
                        email=demo_user['email'],
                        password=password_hash,
                        role=demo_user['role'],
                        score=demo_user['score'],
                        streak=demo_user['streak'],
                        weak_areas=demo_user['weak_areas'],
                    ))

            db.session.commit()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
