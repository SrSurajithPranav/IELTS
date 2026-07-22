from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.submission import Submission
from models.user import User
from utils.storage import upload_audio
import datetime

submissions_bp = Blueprint('submissions', __name__)


def _allowed(user, student_id=None):
    """True when the caller can access submissions for student_id."""
    if user.role == 'admin':
        return True
    if user.role == 'teacher':
        if student_id is None:
            return True
        target = User.query.get(student_id)
        return target and target.teacher_id == user.id
    return user.id == student_id


@submissions_bp.route('/', methods=['POST'])
@jwt_required()
def submit():
    uid = int(get_jwt_identity())
    json_data = request.get_json(silent=True) or {}
    task_id  = request.form.get('task_id') or json_data.get('task_id') or None
    content  = request.form.get('content', '') or json_data.get('content', '')
    file_url = None

    if 'audio' in request.files:
        file_url = upload_audio(request.files['audio'], folder='submissions')

    sub = Submission(
        student_id=uid,
        task_id=int(task_id) if task_id else None,
        content=content,
        file_url=file_url,
        status='submitted',
    )
    db.session.add(sub)
    db.session.commit()
    _update_streak(uid)
    return jsonify(sub.to_dict()), 201


@submissions_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def student_submissions(student_id):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _allowed(user, student_id):
        return jsonify({'error': 'Forbidden'}), 403
    subs = (Submission.query
            .filter_by(student_id=student_id)
            .order_by(Submission.submitted_at.desc())
            .all())
    return jsonify([s.to_dict() for s in subs])


@submissions_bp.route('/pending', methods=['GET'])
@jwt_required()
def pending():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role not in ('admin', 'teacher'):
        return jsonify({'error': 'Forbidden'}), 403

    query = Submission.query.filter_by(status='submitted')

    # Teachers only see submissions from their own students
    if user.role == 'teacher':
        my_student_ids = [
            u.id for u in User.query.filter_by(role='student', teacher_id=uid).all()
        ]
        query = query.filter(Submission.student_id.in_(my_student_ids))

    subs = query.order_by(Submission.submitted_at.asc()).all()
    return jsonify([s.to_dict() for s in subs])


@submissions_bp.route('/review/<int:submission_id>', methods=['POST'])
@jwt_required()
def review_submission(submission_id):
    """Teacher/admin posts feedback and an optional band score."""
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role not in ('admin', 'teacher'):
        return jsonify({'error': 'Forbidden'}), 403

    sub = Submission.query.get_or_404(submission_id)

    # Teachers can only review their own students' submissions
    if user.role == 'teacher':
        student = User.query.get(sub.student_id)
        if not student or student.teacher_id != uid:
            return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json(silent=True) or {}
    sub.feedback_text = data.get('feedback_text', sub.feedback_text)
    sub.status        = 'reviewed'
    sub.reviewed_at   = datetime.datetime.utcnow()

    raw_band = data.get('band_score')
    if raw_band is not None:
        try:
            band = float(raw_band)
            if not (0 <= band <= 9):
                return jsonify({'error': 'band_score must be 0–9'}), 400
            sub.band_score = band
        except (TypeError, ValueError):
            return jsonify({'error': 'band_score must be a number'}), 400

    db.session.commit()

    # Recompute student's overall + per-skill bands
    student = User.query.get(sub.student_id)
    student.compute_bands()
    db.session.commit()

    return jsonify({'message': 'Reviewed', 'submission': sub.to_dict()})


def _update_streak(student_id):
    user  = User.query.get(student_id)
    today = datetime.date.today()
    if user.last_active_date == today:
        return
    if user.last_active_date == today - datetime.timedelta(days=1):
        user.streak += 1
    else:
        user.streak = 1
    user.last_active_date = today
    db.session.commit()
