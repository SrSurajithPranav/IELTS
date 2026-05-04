from datetime import datetime, timedelta
import secrets
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models.db import db
from models.user import User
from models.login_request import LoginRequest
from utils.emailer import send_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            name:
              type: string
              example: "John Doe"
            email:
              type: string
              example: "john@example.com"
            password:
              type: string
              example: "password123"
    responses:
      201:
        description: User registered successfully
      409:
        description: Email already registered
    """
    data = request.get_json() or {}
    if not data.get('email') or not data.get('password') or not data.get('name'):
      return jsonify({'error': 'name, email and password are required'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        role='student'
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and get JWT tokenssss
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            email:
              type: string
              example: "admin@ielts.com"
            password:
              type: string
              example: "admin123"
    responses:
      200:
        description: Login successful
      401:
        description: Invalid credentials
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    if not email or not password:
      return jsonify({'error': 'email and password are required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Optional approval gate for student logins.
    if current_app.config.get('REQUIRE_LOGIN_APPROVAL', True) and user.role == 'student':
      now = datetime.utcnow()
      approved_request = LoginRequest.query.filter(
        LoginRequest.email == user.email,
        LoginRequest.approved.is_(True),
        LoginRequest.used.is_(False),
        LoginRequest.expires_at > now,
      ).order_by(LoginRequest.created_at.desc()).first()

      if not approved_request:
        admin_email = current_app.config.get('ADMIN_APPROVER_EMAIL')
        if not admin_email:
          return jsonify({
            'error': 'Student login approval is enabled but ADMIN_APPROVER_EMAIL is not configured.',
          }), 503

        # Reuse active pending request when available to avoid spamming.
        pending = LoginRequest.query.filter(
          LoginRequest.email == user.email,
          LoginRequest.approved.is_(False),
          LoginRequest.expires_at > now,
        ).order_by(LoginRequest.created_at.desc()).first()

        if not pending:
          pending = LoginRequest(
            email=user.email,
            token=secrets.token_urlsafe(32),
            expires_at=now + timedelta(minutes=20),
          )
          db.session.add(pending)
          db.session.commit()

        backend_base = current_app.config.get('BACKEND_BASE_URL') or request.host_url.rstrip('/')
        approve_url = f"{backend_base.rstrip('/')}/api/auth/approve/{pending.token}"
        subject = f"Approve student login: {user.email}"
        body = (
          "A student requested login access.\n\n"
          f"Student: {user.name} ({user.email})\n"
          f"Requested at: {now.isoformat()} UTC\n\n"
          "Approve this login by opening:\n"
          f"{approve_url}\n\n"
          "This approval expires in 20 minutes."
        )
        send_email(subject, body, admin_email, current_app.config)
        return jsonify({
          'error': 'Login requires admin approval. Approval link sent to admin email.',
          'needs_approval': True,
        }), 403

      approved_request.used = True
      db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/approve/<token>', methods=['GET'])
def approve_login(token):
    """Approve a pending student login request via magic link."""
    now = datetime.utcnow()
    req = LoginRequest.query.filter_by(token=token).first()
    if not req:
        return jsonify({'error': 'Invalid approval link'}), 404
    if req.expires_at <= now:
        return jsonify({'error': 'Approval link expired'}), 410
    req.approved = True
    db.session.commit()
    return jsonify({'message': f'Login approved for {req.email}. Student can now sign in.'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """
    Get current user profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User profile
      401:
        description: Unauthorized
    """
    user = User.query.get(int(get_jwt_identity()))
    return jsonify(user.to_dict())
