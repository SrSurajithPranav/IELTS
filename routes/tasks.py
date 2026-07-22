from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.task import Task
from models.student_plan import StudentPlan
from models.plan import Plan
from models.user import User
from datetime import date

tasks_bp = Blueprint('tasks', __name__)


def _is_admin_or_teacher(user):
    return user and user.role in ('admin', 'teacher')


def _current_task_day(sp: StudentPlan) -> int:
    calendar_days = (date.today() - sp.start_date).days + 1
    plan = Plan.query.get(sp.plan_id)
    if plan and plan.session_type == 'solo':
        return max(1, (calendar_days + 1) // 2)
    return max(1, calendar_days)


@tasks_bp.route('/today', methods=['GET'])
@jwt_required()
def today_tasks():
    uid = int(get_jwt_identity())
    sp  = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': [], 'day': 0,
                        'message': 'No active plan. Ask your teacher to assign one.'})
    day   = _current_task_day(sp)
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    if not tasks:
        return jsonify({'tasks': [], 'day': day,
                        'message': f'No tasks assigned for Day {day} yet. '
                                   f'Ask your teacher to add tasks for Day {day}.'})
    return jsonify({'tasks': [t.to_dict() for t in tasks], 'day': day})


@tasks_bp.route('/day/<int:day>', methods=['GET'])
@jwt_required()
def tasks_by_day(day):
    uid = int(get_jwt_identity())
    sp  = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': []})
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@tasks_bp.route('/plan/<int:plan_id>/day/<int:day>', methods=['GET'])
@jwt_required()
def tasks_by_plan_and_day(plan_id, day):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _is_admin_or_teacher(user):
        return jsonify({'error': 'Forbidden'}), 403
    tasks = Task.query.filter_by(plan_id=plan_id, day_number=day).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _is_admin_or_teacher(user):
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    task = Task(**data)
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.route('/<int:task_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_task(task_id):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _is_admin_or_teacher(user):
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
