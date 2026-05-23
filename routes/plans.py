from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.plan import Plan
from models.student_plan import StudentPlan
from models.task import Task
from models.user import User
import datetime
from utils.emailer import send_email
from flask import current_app
from routes.notifications import push_notification

plans_bp = Blueprint('plans', __name__)


def _plan_task_templates(plan_name):
  """Return rotating IELTS task templates for auto-generation."""
  plan_label = (plan_name or 'IELTS Plan').strip()
  return [
    {
      'type': 'reading',
      'title': f'{plan_label} Reading Drill',
      'description': 'Skim, scan, and answer T/F/NG questions from one passage.',
      'duration': '35 min',
    },
    {
      'type': 'listening',
      'title': f'{plan_label} Listening Drill',
      'description': 'Complete note/form answers while tracking key details and numbers.',
      'duration': '30 min',
    },
    {
      'type': 'writing',
      'title': f'{plan_label} Writing Task',
      'description': 'Write IELTS response with focus on structure, clarity, and lexical range.',
      'duration': '40 min',
    },
    {
      'type': 'speaking',
      'title': f'{plan_label} Speaking Prompt',
      'description': 'Record part 2 style answer and self-review fluency and coherence.',
      'duration': '20 min',
    },
    {
      'type': 'grammar',
      'title': f'{plan_label} Accuracy Builder',
      'description': 'Target one weak grammar pattern and apply it in short sentences.',
      'duration': '20 min',
    },
  ]


def _difficulty_for_day(day_number):
  if day_number <= 10:
    return 'beginner'
  if day_number <= 30:
    return 'intermediate'
  return 'advanced'


def _parse_date(raw_value):
  if not raw_value:
    return None
  if isinstance(raw_value, datetime.date):
    return raw_value
  try:
    return datetime.date.fromisoformat(str(raw_value))
  except (TypeError, ValueError):
    return None


def _create_student_plan(student_id, plan_id, *, due_date=None, reminder_days=3, start_date=None):
  StudentPlan.query.filter_by(student_id=student_id, is_active=True).update({'is_active': False})
  sp = StudentPlan(
    student_id=student_id,
    plan_id=plan_id,
    start_date=start_date or datetime.date.today(),
    due_date=due_date,
    reminder_days=max(int(reminder_days or 0), 0),
    is_active=True,
  )
  db.session.add(sp)
  return sp

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

    try:
      student_id = int(data['student_id'])
      plan_id = int(data['plan_id'])
    except (TypeError, ValueError):
      return jsonify({'error': 'student_id and plan_id must be integers'}), 400

    student = User.query.get(student_id)
    if not student or student.role != 'student':
      return jsonify({'error': 'student not found'}), 404

    plan = Plan.query.get(plan_id)
    if not plan:
      return jsonify({'error': 'plan not found'}), 404

    due_date = _parse_date(data.get('due_date'))
    try:
      reminder_days = int(data.get('reminder_days', 3))
    except (TypeError, ValueError):
      reminder_days = 3

    sp = _create_student_plan(
        student_id,
        plan_id,
        due_date=due_date,
        reminder_days=reminder_days,
    )
    db.session.commit()

    if due_date:
        push_notification(
            student_id,
            'New plan assigned',
            f"{plan.name} is due on {due_date.isoformat()}. Reminder window: {sp.reminder_days} day(s).",
            'reminder',
        )
        db.session.commit()
    return jsonify(sp.to_dict()), 201


@plans_bp.route('/assign/bulk', methods=['POST'])
@jwt_required()
def assign_plan_bulk():
    """
    Assign one plan to multiple students (Admin only)
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
            plan_id:
              type: integer
            student_ids:
              type: array
              items:
                type: integer
    responses:
      201:
        description: Bulk assignment summary
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    student_ids = data.get('student_ids') or []

    try:
        plan_id = int(plan_id)
    except (TypeError, ValueError):
        return jsonify({'error': 'plan_id must be an integer'}), 400

    if not isinstance(student_ids, list) or not student_ids:
        return jsonify({'error': 'student_ids must be a non-empty array'}), 400

    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'plan not found'}), 404

    due_date = _parse_date(data.get('due_date'))
    try:
      reminder_days = int(data.get('reminder_days', 3))
    except (TypeError, ValueError):
      reminder_days = 3

    assigned = []
    skipped = []
    for raw_id in student_ids:
        try:
            student_id = int(raw_id)
        except (TypeError, ValueError):
            skipped.append({'student_id': raw_id, 'reason': 'invalid id'})
            continue

        student = User.query.get(student_id)
        if not student or student.role != 'student':
            skipped.append({'student_id': student_id, 'reason': 'student not found'})
            continue

        sp = _create_student_plan(
          student_id,
          plan_id,
          due_date=due_date,
          reminder_days=reminder_days,
        )
        assigned.append({'student_id': student_id, 'student_name': student.name})

    db.session.commit()
    return jsonify({'plan_id': plan_id, 'assigned': assigned, 'skipped': skipped}), 201


    @plans_bp.route('/reminders/run', methods=['POST'])
    @jwt_required()
    def run_plan_reminders():
      uid = int(get_jwt_identity())
      user = User.query.get(uid)
      if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

      data = request.get_json(silent=True) or {}
      try:
        days_ahead = int(data.get('days_ahead', 3))
      except (TypeError, ValueError):
        days_ahead = 3
      days_ahead = max(days_ahead, 0)
      cutoff = datetime.date.today() + datetime.timedelta(days=days_ahead)

      assignments = StudentPlan.query.filter_by(is_active=True).all()
      notified = []
      for assignment in assignments:
        if not assignment.due_date or assignment.reminder_sent_at:
          continue
        if assignment.due_date > cutoff:
          continue
        if assignment.due_date < datetime.date.today():
          continue

        student = User.query.get(assignment.student_id)
        plan = Plan.query.get(assignment.plan_id)
        if not student or not plan:
          continue

        remaining = assignment.days_remaining()
        push_notification(
          student.id,
          f"Reminder: {plan.name} is due soon",
          f"{plan.name} is due on {assignment.due_date.isoformat()}. {remaining} day(s) remaining.",
          'reminder',
        )
        assignment.reminder_sent_at = datetime.datetime.utcnow()
        notified.append({
          'student_id': student.id,
          'student_name': student.name,
          'plan_id': plan.id,
          'plan_name': plan.name,
          'due_date': str(assignment.due_date),
        })

      db.session.commit()
      return jsonify({'notified': notified, 'count': len(notified)}), 200


@plans_bp.route('/<int:plan_id>/generate-tasks', methods=['POST'])
@jwt_required()
def generate_plan_tasks(plan_id):
    """
    Auto-generate a structured task calendar for a plan (Admin only)
    ---
    tags:
      - Plans
    security:
      - Bearer: []
    parameters:
      - name: plan_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: false
        schema:
          properties:
            days:
              type: integer
            clear_existing:
              type: boolean
    responses:
      201:
        description: Tasks generated
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'plan not found'}), 404

    data = request.get_json(silent=True) or {}
    try:
        days = int(data.get('days', min(plan.duration_days, 30)))
    except (TypeError, ValueError):
        days = min(plan.duration_days, 30)
    days = max(1, min(days, max(plan.duration_days, 1)))
    clear_existing = bool(data.get('clear_existing', False))

    if clear_existing:
        Task.query.filter_by(plan_id=plan_id).delete(synchronize_session=False)

    templates = _plan_task_templates(plan.name)
    created = 0
    for day_number in range(1, days + 1):
        template = templates[(day_number - 1) % len(templates)]
        task_exists = Task.query.filter_by(
            plan_id=plan_id,
            day_number=day_number,
            title=template['title'],
        ).first()
        if task_exists:
            continue

        db.session.add(Task(
            plan_id=plan_id,
            day_number=day_number,
            type=template['type'],
            title=template['title'],
            description=template['description'],
            duration=template['duration'],
            difficulty=_difficulty_for_day(day_number),
        ))
        created += 1

    db.session.commit()
    return jsonify({'plan_id': plan_id, 'days_generated': days, 'tasks_created': created}), 201


@plans_bp.route('/assignments', methods=['GET'])
@jwt_required()
def list_plan_assignments():
    """
    List active student-plan assignments (Admin only)
    ---
    tags:
      - Plans
    security:
      - Bearer: []
    responses:
      200:
        description: Active assignments
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    assignments = StudentPlan.query.filter_by(is_active=True).order_by(StudentPlan.id.desc()).all()
    rows = []
    for assignment in assignments:
        student = User.query.get(assignment.student_id)
        plan = Plan.query.get(assignment.plan_id)
        rows.append({
            'id': assignment.id,
            'student_id': assignment.student_id,
            'student_name': student.name if student else None,
            'student_email': student.email if student else None,
            'plan_id': assignment.plan_id,
            'plan_name': plan.name if plan else None,
            'start_date': str(assignment.start_date),
            'due_date': str(assignment.due_date) if assignment.due_date else None,
            'reminder_days': assignment.reminder_days,
            'reminder_sent_at': assignment.reminder_sent_at.isoformat() if assignment.reminder_sent_at else None,
            'days_remaining': assignment.days_remaining(),
            'needs_reminder': assignment.needs_reminder(),
            'current_day': assignment.current_day(),
        })
    return jsonify(rows), 200

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

    _create_student_plan(uid, plan.id)
    sp = StudentPlan.query.filter_by(student_id=uid, plan_id=plan.id, is_active=True).order_by(StudentPlan.id.desc()).first()
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
