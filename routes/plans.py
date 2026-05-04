from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.plan import Plan
from models.student_plan import StudentPlan
from models.user import User
import datetime
from utils.emailer import send_email
from flask import current_app

plans_bp = Blueprint('plans', __name__)

@plans_bp.route('/', methods=['GET'])
@jwt_required()
def list_plans():
    """
    Get all available plans
    ---
    tags:
      - Plans
    security:
      - Bearer: []
    responses:
      200:
        description: List of plans
    """
    plans = Plan.query.all()
    return jsonify([p.to_dict() for p in plans])

@plans_bp.route('/', methods=['POST'])
@jwt_required()
def create_plan():
    """
    Create a new plan (Admin only)
    ---
    tags:
      - Plans
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            name:
              type: string
            duration_days:
              type: integer
    responses:
      201:
        description: Plan created
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
      return jsonify({'error': 'name is required'}), 400

    duration_days = data.get('duration_days')
    if duration_days is None:
      return jsonify({'error': 'duration_days is required'}), 400
    try:
      duration_days = int(duration_days)
    except (TypeError, ValueError):
      return jsonify({'error': 'duration_days must be an integer'}), 400
    if duration_days <= 0:
      return jsonify({'error': 'duration_days must be greater than 0'}), 400

    plan_data = {
      'name': name,
      'duration_days': duration_days,
      'session_type': data.get('session_type', 'solo'),
      'description': data.get('description', ''),
    }
    plan = Plan(**plan_data)
    db.session.add(plan)
    db.session.commit()
    return jsonify(plan.to_dict()), 201

@plans_bp.route('/assign', methods=['POST'])
@jwt_required()
def assign_plan():
    """
    Assign a plan to a student (Admin only)
    ---
    tags:
      - Plans
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            student_id:
              type: integer
            plan_id:
              type: integer
    responses:
      201:
        description: Plan assigned
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json(silent=True) or {}
    if not data.get('student_id') or not data.get('plan_id'):
      return jsonify({'error': 'student_id and plan_id are required'}), 400
    StudentPlan.query.filter_by(student_id=data['student_id'], is_active=True).update({'is_active': False})
    sp = StudentPlan(
        student_id=data['student_id'],
        plan_id=data['plan_id'],
        start_date=datetime.date.today()
    )
    db.session.add(sp)
    db.session.commit()
    return jsonify(sp.to_dict()), 201

@plans_bp.route('/my', methods=['GET'])
@jwt_required()
def my_plan():
    """Get current active plan for logged-in student."""
    uid = int(get_jwt_identity())
    sp = StudentPlan.query.filter_by(student_id=uid, is_active=True).order_by(StudentPlan.id.desc()).first()
    if not sp:
        return jsonify({'active_plan': None}), 200
    plan = Plan.query.get(sp.plan_id)
    return jsonify({
        'active_plan': {
            **sp.to_dict(),
            'plan': plan.to_dict() if plan else None,
        }
    })


@plans_bp.route('/select', methods=['POST'])
@jwt_required()
def select_plan():
    """Student selects a plan and admin gets email with details."""
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'student':
        return jsonify({'error': 'Only students can select plans'}), 403

    data = request.get_json() or {}
    plan_id = data.get('plan_id')
    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    StudentPlan.query.filter_by(student_id=uid, is_active=True).update({'is_active': False})
    sp = StudentPlan(student_id=uid, plan_id=plan.id, start_date=datetime.date.today(), is_active=True)
    db.session.add(sp)
    db.session.commit()

    subject = f"New plan selection: {user.email}"
    body = (
        "A student selected a training plan.\n\n"
        f"Student: {user.name} ({user.email})\n"
        f"Plan: {plan.name}\n"
        f"Duration: {plan.duration_days} days\n"
        f"Session Type: {plan.session_type}\n"
        f"Description: {plan.description or 'N/A'}\n"
        f"Selected On: {datetime.date.today().isoformat()}\n"
    )
    admin_email = current_app.config.get('ADMIN_APPROVER_EMAIL')
    if admin_email:
        send_email(subject, body, admin_email, current_app.config)

    return jsonify({'message': 'Plan selected successfully', 'student_plan': sp.to_dict(), 'plan': plan.to_dict()}), 201
