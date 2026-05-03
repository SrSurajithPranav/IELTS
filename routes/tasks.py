from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.task import Task
from models.student_plan import StudentPlan
from models.user import User
from datetime import date

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/today', methods=['GET'])
@jwt_required()
def today_tasks():
    """
    Get today's tasks for current user
    ---
    tags:
      - Tasks
    security:
      - Bearer: []
    responses:
      200:
        description: Today's tasks
      401:
        description: Unauthorized
    """
    uid = get_jwt_identity()
    sp = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': [], 'day': 0})
    delta = (date.today() - sp.start_date).days + 1
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=delta).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks], 'day': delta})

@tasks_bp.route('/day/<int:day>', methods=['GET'])
@jwt_required()
def tasks_by_day(day):
    """
    Get tasks for a specific day
    ---
    tags:
      - Tasks
    security:
      - Bearer: []
    parameters:
      - name: day
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Tasks for the day
    """
    uid = get_jwt_identity()
    sp = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': []})
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    """
    Create a new task (Admin only)
    ---
    tags:
      - Tasks
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            plan_id:
              type: integer
            day_number:
              type: integer
            type:
              type: string
            title:
              type: string
    responses:
      201:
        description: Task created
      403:
        description: Forbidden (Admin only)
    """
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    task = Task(**data)
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_task(task_id):
    """
    Update or delete a task (Admin only)
    ---
    tags:
      - Tasks
    security:
      - Bearer: []
    parameters:
      - name: task_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Task updated/deleted
      403:
        description: Forbidden (Admin only)
    """
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    task = Task.query.get_or_404(task_id)
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Deleted'})
    data = request.get_json()
    for k, v in data.items():
        setattr(task, k, v)
    db.session.commit()
    return jsonify(task.to_dict())
