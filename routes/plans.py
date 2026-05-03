from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.plan import Plan
from models.student_plan import StudentPlan
from models.user import User
import datetime

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
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    plan = Plan(**data)
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
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    StudentPlan.query.filter_by(student_id=data['student_id'], is_active=True).update({'is_active': False})
    sp = StudentPlan(
        student_id=data['student_id'],
        plan_id=data['plan_id'],
        start_date=datetime.date.today()
    )
    db.session.add(sp)
    db.session.commit()
    return jsonify(sp.to_dict()), 201
