"""
Simple in-app notifications.
Stored in DB. Frontend can poll /api/notifications/unread.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.notification import Notification

notifs_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notifs_bp.route('/unread', methods=['GET'])
@jwt_required()
def unread():
    uid = int(get_jwt_identity())
    items = (
        Notification.query.filter_by(user_id=uid, read=False)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return jsonify([n.to_dict() for n in items])


@notifs_bp.route('/all', methods=['GET'])
@jwt_required()
def all_notifs():
    uid = int(get_jwt_identity())
    items = (
        Notification.query.filter_by(user_id=uid)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([n.to_dict() for n in items])


@notifs_bp.route('/read/<int:notif_id>', methods=['POST'])
@jwt_required()
def mark_read(notif_id):
    uid = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=uid).first_or_404()
    notif.read = True
    db.session.commit()
    return jsonify({'ok': True})


@notifs_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    uid = int(get_jwt_identity())
    Notification.query.filter_by(user_id=uid, read=False).update({'read': True})
    db.session.commit()
    return jsonify({'ok': True})


def push_notification(user_id, title, body, notif_type='info'):
    """Helper for other routes to enqueue notifications."""
    notif = Notification(user_id=user_id, title=title, body=body, type=notif_type)
    db.session.add(notif)
