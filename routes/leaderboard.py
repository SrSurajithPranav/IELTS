from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from models.db import db
from models.user import User
from models.submission import Submission

leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')


@leaderboard_bp.route('/', methods=['GET'])
@jwt_required()
def get_leaderboard():
    """Top students ranked by streak + submission count + score."""
    sub_counts = dict(
        db.session.query(Submission.student_id, func.count(Submission.id))
        .group_by(Submission.student_id)
        .all()
    )

    students = User.query.filter_by(role='student').all()
    board = []
    for student in students:
        count = sub_counts.get(student.id, 0)
        points = (student.streak * 10) + (count * 5) + int((student.score or 0) * 2)
        board.append({
            'id': student.id,
            'name': student.name,
            'streak': student.streak,
            'score': student.score or 0,
            'submissions': count,
            'points': points,
        })

    board.sort(key=lambda x: x['points'], reverse=True)
    for i, entry in enumerate(board):
        entry['rank'] = i + 1

    return jsonify(board[:20])
