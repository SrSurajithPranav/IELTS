from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def list_users():
    """
    List all students (Admin only)
    ---
    tags:
      - Users
    security:
      - Bearer: []
    responses:
      200:
        description: List of students
      403:
        description: Forbidden (Admin only)
    """
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    students = User.query.filter_by(role='student').all()
    return jsonify([s.to_dict() for s in students])

@users_bp.route('/<int:user_id>', methods=['PATCH'])
@jwt_required()
def update_user(user_id):
    """
    Update user profile
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        schema:
          properties:
            name:
              type: string
            zoom_link:
              type: string
    responses:
      200:
        description: User updated
      403:
        description: Forbidden
    """
    uid = get_jwt_identity()
    user = User.query.get(uid)
    target = User.query.get_or_404(user_id)
    if user.role != 'admin' and uid != user_id:
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    allowed = ['name', 'zoom_link']
    if user.role == 'admin':
        allowed += ['weak_areas']
    for k in allowed:
        if k in data:
            setattr(target, k, data[k])
    db.session.commit()
    return jsonify(target.to_dict())
