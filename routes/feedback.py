from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.submission import Submission
from models.user import User
from utils.storage import upload_audio
import datetime

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/<int:submission_id>', methods=['POST'])
@jwt_required()
def give_feedback(submission_id):
    """
    Give feedback on a submission (Admin only)
    ---
    tags:
      - Feedback
    security:
      - Bearer: []
    parameters:
      - name: submission_id
        in: path
        type: integer
        required: true
      - name: feedback_text
        in: formData
        type: string
      - name: audio
        in: formData
        type: file
    responses:
      200:
        description: Feedback added
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    sub = Submission.query.get_or_404(submission_id)
    feedback_text = request.form.get('feedback_text', '')
    sub.feedback_text = feedback_text
    sub.status = 'reviewed'
    sub.reviewed_at = datetime.datetime.utcnow()
    if 'audio' in request.files:
        sub.feedback_audio_url = upload_audio(request.files['audio'], folder='feedback')
    db.session.commit()
    return jsonify(sub.to_dict())
