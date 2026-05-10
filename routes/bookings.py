from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.booking_slot import BookingSlot
from datetime import datetime

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


@bookings_bp.route('/slots', methods=['GET'])
@jwt_required()
def list_slots():
    teacher = request.args.get('teacher')
    q = BookingSlot.query
    if teacher:
        try:
            q = q.filter_by(teacher_id=int(teacher))
        except:
            pass
    slots = q.order_by(BookingSlot.start_time).all()
    return jsonify([s.to_dict() for s in slots])


@bookings_bp.route('/slots', methods=['POST'])
@jwt_required()
def create_slot():
    data = request.get_json() or {}
    slot = BookingSlot(
        teacher_id=int(data.get('teacher_id')),
        start_time=datetime.fromisoformat(data.get('start_time')),
        end_time=datetime.fromisoformat(data.get('end_time')),
        is_booked=False,
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict()), 201


@bookings_bp.route('/book/<int:slot_id>', methods=['POST'])
@jwt_required()
def book_slot(slot_id):
    uid = int(get_jwt_identity())
    slot = BookingSlot.query.get(slot_id)
    if not slot:
        return jsonify({'error': 'Not found'}), 404
    if slot.is_booked:
        return jsonify({'error': 'Already booked'}), 409
    slot.is_booked = True
    slot.student_id = uid
    db.session.commit()
    return jsonify(slot.to_dict())
