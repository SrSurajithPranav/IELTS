from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.submission import Submission
from models.user import User
from utils.storage import upload_audio
import datetime

submissions_bp = Blueprint('submissions', __name__)

@submissions_bp.route('/', methods=['POST'])
@jwt_required()
def submit():
    """
    Submit a task with optional audio file
    ---
    tags:
      - Submissions
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - name: task_id
        in: formData
        type: integer
        required: true
      - name: content
        in: formData
        type: string
      - name: audio
        in: formData
        type: file
    responses:
      201:
        description: Submission created
    """
    uid = get_jwt_identity()
    task_id = request.form.get('task_id') or request.get_json().get('task_id')
    content = request.form.get('content', '')
    file_url = None

    if 'audio' in request.files:
        file_url = upload_audio(request.files['audio'], folder='submissions')

    sub = Submission(
        student_id=uid,
        task_id=task_id,
        content=content,
        file_url=file_url,
        status='submitted'
    )
    db.session.add(sub)
    db.session.commit()
    _update_streak(uid)
    return jsonify(sub.to_dict()), 201

@submissions_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def student_submissions(student_id):
    """
    Get all submissions for a student
    ---
    tags:
      - Submissions
    security:
      - Bearer: []
    parameters:
      - name: student_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Student submissions
    """
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin' and uid != student_id:
        return jsonify({'error': 'Forbidden'}), 403
    subs = Submission.query.filter_by(student_id=student_id).order_by(Submission.submitted_at.desc()).all()
    return jsonify([s.to_dict() for s in subs])

@submissions_bp.route('/pending', methods=['GET'])
@jwt_required()
def pending():
    """
    Get all pending submissions (Admin only)
    ---
    tags:
      - Submissions
    security:
      - Bearer: []
    responses:
      200:
        description: Pending submissions
      403:
        description: Forbidden (Admin only)
    """
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    subs = Submission.query.filter_by(status='submitted').order_by(Submission.submitted_at.asc()).all()
    return jsonify([s.to_dict() for s in subs])

def _update_streak(student_id):
    user = User.query.get(student_id)
    today = datetime.date.today()
    if user.last_active_date == today:
        return
    if user.last_active_date == today - datetime.timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1
    user.last_active_date = today
    db.session.commit()
