from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.task import Task
from models.student_plan import StudentPlan
from models.plan import Plan
from models.user import User
from datetime import date

tasks_bp = Blueprint('tasks', __name__)


def _current_task_day(sp: StudentPlan) -> int:
  """
  Calculate which task-day to show today.
  Solo plans: sessions every 2 calendar days -> task_day = ceil(calendar_days / 2)
  Group plans: daily -> task_day = calendar_days
  """
  calendar_days = (date.today() - sp.start_date).days + 1
  plan = Plan.query.get(sp.plan_id)
  if plan and plan.session_type == 'solo':
    return max(1, (calendar_days + 1) // 2)
  return max(1, calendar_days)

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
    uid = int(get_jwt_identity())
    sp = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
      return jsonify({'tasks': [], 'day': 0, 'message': 'No active plan. Ask your teacher to assign one.'})
    day = _current_task_day(sp)
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks], 'day': day})

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
    uid = int(get_jwt_identity())
    sp = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': []})
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})

@tasks_bp.route('/plan/<int:plan_id>/day/<int:day>', methods=['GET'])
@jwt_required()
def tasks_by_plan_and_day(plan_id, day):
    """Get tasks for a specific plan and day (admin and teacher tools)."""
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    tasks = Task.query.filter_by(plan_id=plan_id, day_number=day).all()
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
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
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
