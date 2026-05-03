from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.batch import Batch, BatchMember
from models.user import User

batches_bp = Blueprint('batches', __name__)

@batches_bp.route('/', methods=['GET', 'POST'])
@jwt_required()
def batches():
    """
    List batches or create a new batch
    ---
    tags:
      - Batches
    security:
      - Bearer: []
    responses:
      200:
        description: List of batches (GET)
      201:
        description: Batch created (POST)
      403:
        description: Forbidden (POST requires admin)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if request.method == 'GET':
        if user.role == 'admin':
            return jsonify([b.to_dict() for b in Batch.query.all()])
        memberships = BatchMember.query.filter_by(student_id=uid).all()
        batch_ids = [m.batch_id for m in memberships]
        return jsonify([Batch.query.get(bid).to_dict() for bid in batch_ids])
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    batch = Batch(**data)
    db.session.add(batch)
    db.session.commit()
    return jsonify(batch.to_dict()), 201

@batches_bp.route('/<int:batch_id>/members', methods=['POST'])
@jwt_required()
def add_member(batch_id):
    """
    Add student to batch (Admin only)
    ---
    tags:
      - Batches
    security:
      - Bearer: []
    parameters:
      - name: batch_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          properties:
            student_id:
              type: integer
    responses:
      201:
        description: Member added
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    member = BatchMember(batch_id=batch_id, student_id=data['student_id'])
    db.session.add(member)
    db.session.commit()
    return jsonify({'message': 'Added'}), 201
