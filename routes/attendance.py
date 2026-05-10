from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import db
from models.attendance import Attendance

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')


@attendance_bp.route('/session/<int:session_id>', methods=['GET'])
@jwt_required()
def get_for_session(session_id):
    rows = Attendance.query.filter_by(session_id=session_id).all()
    return jsonify([r.to_dict() for r in rows])


@attendance_bp.route('/', methods=['POST'])
@jwt_required()
def mark():
    data = request.get_json() or {}
    a = Attendance(
        session_id=int(data.get('session_id')),
        student_id=int(data.get('student_id')),
        status=data.get('status', 'present')
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201
