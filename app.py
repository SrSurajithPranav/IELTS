from flask import Flask, request
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
from models.login_request import LoginRequest
from models.notification import Notification
from models.session import LiveSession, SessionRecording
from models.quiz import Quiz, QuizQuestion, QuizAttempt
from models.resource import Resource

def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    app.url_map.strict_slashes = False  # Prevent 308 redirects that drop Authorization header

    # Run config-specific validation (e.g. ProductionConfig checks DATABASE_URL)
    config_cls = config[config_name]
    if hasattr(config_cls, 'init_app'):
        config_cls.init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    CORS(app,
         resources={r"/api/.*": {"origins": "*"}},
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
         expose_headers=["Authorization"]
    )
    # Rate limiter
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])
    
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

    @app.before_request
    def normalize_authorization_header():
        """Allow raw JWT token in Authorization header (Swagger convenience)."""
        auth = request.headers.get('Authorization', '').strip()
        if auth and not auth.lower().startswith('bearer '):
            request.environ['HTTP_AUTHORIZATION'] = f'Bearer {auth}'

    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)

    from flask import send_from_directory

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(uploads_dir, filename)
    
    # Health check endpoints
    @app.route('/', methods=['GET'])
    def root_health():
        """Root health check for platform health checks"""
        return {'status': 'ok', 'service': 'ielts-api'}, 200
    
    # Import and register blueprints (moved here so limiter is available)
    from routes.auth import auth_bp
    from routes.tasks import tasks_bp
    from routes.submissions import submissions_bp
    from routes.feedback import feedback_bp
    from routes.plans import plans_bp
    from routes.users import users_bp
    from routes.batches import batches_bp
    from routes.students import students_bp
    from routes.sessions import sessions_bp
    from routes.quizzes import quizzes_bp, resources_bp
    from routes.ai import ai_bp
    from routes.leaderboard import leaderboard_bp
    from routes.notifications import notifs_bp
    from routes.announcements import announcements_bp
    from routes.vocabulary import vocabulary_bp
    from routes.speaking import speaking_bp
    from routes.attendance import attendance_bp
    from routes.mistakes import mistakes_bp
    from routes.bookings import bookings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(submissions_bp, url_prefix='/api/submissions')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    app.register_blueprint(plans_bp, url_prefix='/api/plans')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(batches_bp, url_prefix='/api/batches')
    app.register_blueprint(students_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(notifs_bp)
    app.register_blueprint(announcements_bp)
    app.register_blueprint(vocabulary_bp)
    app.register_blueprint(speaking_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(mistakes_bp)
    app.register_blueprint(bookings_bp)

    # Apply specific rate limit to login endpoint (10 per minute)
    try:
        login_view = app.view_functions.get('auth.login')
        if login_view:
            limiter.limit("10 per minute")(login_view)
    except Exception:
        pass
    
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

        # ── Seed default accounts so the app is usable on first run ──
        from models.user import User

        if not User.query.filter_by(email='teacher@ielts.com').first():
            db.session.add(User(
                name='Ms. Kavitha',
                email='teacher@ielts.com',
                password=generate_password_hash('teacher123'),
                role='admin',
                score=0,
                streak=0,
            ))

        if not User.query.filter_by(email='student@ielts.com').first():
            db.session.add(User(
                name='Arjun Kumar',
                email='student@ielts.com',
                password=generate_password_hash('student123'),
                role='student',
                score=68,
                streak=7,
            ))

        db.session.commit()

        if config_name == 'development':
            from models.user import User

            seeded_student_emails = {
                'student1@gmail.com',
                'student2@gmail.com',
                'student3@gmail.com',
                'student4@gmail.com',
                'student5@gmail.com',
                'student@ielts.com',
                'priya@ielts.com',
                'ravi@ielts.com',
                'anjali@ielts.com',
                'rohan@ielts.com',
            }

            if os.getenv('REMOVE_SEEDED_DEMO_ACCOUNTS', 'true').lower() == 'true':
                demo_users = User.query.filter(User.email.in_(seeded_student_emails)).all()
                demo_ids = [user.id for user in demo_users]

                if demo_ids:
                    from models.submission import Submission
                    from models.student_plan import StudentPlan

                    session_ids = [session.id for session in LiveSession.query.filter(LiveSession.student_id.in_(demo_ids)).all()]

                    if session_ids:
                        SessionRecording.query.filter(SessionRecording.session_id.in_(session_ids)).delete(synchronize_session=False)
                        LiveSession.query.filter(LiveSession.id.in_(session_ids)).delete(synchronize_session=False)

                    Submission.query.filter(Submission.student_id.in_(demo_ids)).delete(synchronize_session=False)
                    StudentPlan.query.filter(StudentPlan.student_id.in_(demo_ids)).delete(synchronize_session=False)
                    BatchMember.query.filter(BatchMember.student_id.in_(demo_ids)).delete(synchronize_session=False)
                    User.query.filter(User.id.in_(demo_ids)).delete(synchronize_session=False)
                    db.session.commit()

            # Ensure required plans exist with requested pricing/cadence details.
            required_plans = [
                {
                    'name': 'Solo Training - 60 Days',
                    'duration_days': 60,
                    'session_type': 'solo',
                    'description': 'INR 10000 for 2 months. 1:1 mentorship. Meeting every 2 days.'
                },
                {
                    'name': 'Solo Training - 90 Days',
                    'duration_days': 90,
                    'session_type': 'solo',
                    'description': 'INR 15000 for 3 months. 1:1 mentorship. Meeting every 2 days.'
                },
                {
                    'name': 'Group Training - 60 Days',
                    'duration_days': 60,
                    'session_type': 'group',
                    'description': 'INR 6000 for 60 days. Group cohort. Attendance requested from all members every 2 days.'
                },
                {
                    'name': 'Group Training - 90 Days',
                    'duration_days': 90,
                    'session_type': 'group',
                    'description': 'INR 10000 for 90 days. Group cohort. Attendance requested from all members every 2 days.'
                },
            ]

            for rp in required_plans:
                existing = Plan.query.filter_by(name=rp['name']).first()
                if existing:
                    existing.duration_days = rp['duration_days']
                    existing.session_type = rp['session_type']
                    existing.description = rp['description']
                else:
                    db.session.add(Plan(**rp))

            db.session.commit()

            speaking_prompts = [
                "Describe a place in your city where students like to study and explain why it helps concentration.",
                "Talk about a teacher who changed the way you learn and say what made the lessons effective.",
                "Describe a skill you improved through practice and explain the routine that helped you most.",
                "Talk about a time you had to speak in public and how you prepared for it.",
                "Describe a helpful habit that improved your daily routine.",
            ]
            writing_prompts = [
                "Some people think online classes are more effective than classroom classes. Discuss both views and give your opinion.",
                "Many cities invest in public transport instead of roads. Discuss the advantages and disadvantages.",
                "Some students prefer to study alone while others prefer group study. Discuss both views and give your opinion.",
                "Public libraries should receive more funding than sports stadiums. Discuss both views and give your opinion.",
                "The best way to learn a language is to live in a country where it is spoken. Discuss both views and give your opinion.",
            ]
            reading_prompts = [
                "Read a passage about renewable energy adoption and answer questions on inference, detail, and main ideas.",
                "Read a passage about study habits and identify the statements that are true, false, or not given.",
                "Read a passage about urban farming and complete matching headings and summary completion tasks.",
                "Read a passage about public health campaigns and choose the best title for each section.",
                "Read a passage about digital learning tools and locate the evidence for each claim.",
            ]
            listening_prompts = [
                "Listen to a campus conversation about accommodation and complete form completion questions.",
                "Listen to a lecture on climate change and answer multiple-choice questions about causes and effects.",
                "Listen to an interview about career planning and identify the speaker's main opinion.",
                "Listen to a museum tour guide and fill in the missing notes for opening times and ticket rules.",
                "Listen to a student announcement and match the key instructions to the correct action.",
            ]

            def build_task_specs(day_number):
                level = 'beginner' if day_number < 15 else 'intermediate' if day_number < 45 else 'advanced'
                return [
                    {
                        'type': 'speaking',
                        'title': f'Day {day_number} Speaking Lab',
                        'description': f"{speaking_prompts[(day_number - 1) % len(speaking_prompts)]} Speak for 60 to 90 seconds and record your answer.",
                        'duration': '15 min',
                        'difficulty': level,
                    },
                    {
                        'type': 'writing',
                        'title': f'Day {day_number} Writing Challenge',
                        'description': f"{writing_prompts[(day_number - 1) % len(writing_prompts)]} Write 250 words with a clear introduction, body, and conclusion.",
                        'duration': '30 min',
                        'difficulty': level,
                    },
                    {
                        'type': 'reading',
                        'title': f'Day {day_number} Reading Sprint',
                        'description': reading_prompts[(day_number - 1) % len(reading_prompts)],
                        'duration': '25 min',
                        'difficulty': level,
                    },
                    {
                        'type': 'listening',
                        'title': f'Day {day_number} Listening Drill',
                        'description': listening_prompts[(day_number - 1) % len(listening_prompts)],
                        'duration': '20 min',
                        'difficulty': level,
                    },
                ]

            for plan in Plan.query.all():
                for day_number in range(1, plan.duration_days + 1):
                    for task_spec in build_task_specs(day_number):
                        existing_task = Task.query.filter_by(
                            plan_id=plan.id,
                            day_number=day_number,
                            type=task_spec['type'],
                        ).first()

                        if existing_task:
                            existing_task.title = task_spec['title']
                            existing_task.description = task_spec['description']
                            existing_task.duration = task_spec['duration']
                            existing_task.difficulty = task_spec['difficulty']
                        else:
                            db.session.add(Task(
                                plan_id=plan.id,
                                day_number=day_number,
                                type=task_spec['type'],
                                title=task_spec['title'],
                                description=task_spec['description'],
                                duration=task_spec['duration'],
                                difficulty=task_spec['difficulty'],
                            ))

            db.session.commit()
    
    return app

if __name__ == '__main__':
    app = create_app()
    debug = os.getenv('FLASK_DEBUG', '0').lower() in {'1', 'true', 'yes'}
    port = int(os.getenv('PORT', 5000))
    app.run(debug=debug, use_reloader=debug, host='0.0.0.0', port=port)