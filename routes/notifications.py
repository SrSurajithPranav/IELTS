from flask import Blueprint, jsonify, Response, stream_with_context, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from models.db import db
from models.notification import Notification
from extensions import socketio
from flask_socketio import join_room, disconnect
from flask_jwt_extended import decode_token
import time
import json

notifs_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notifs_bp.route('/me', methods=['GET'])
@jwt_required()
def my_notifications():
    uid = int(get_jwt_identity())
    rows = Notification.query.filter_by(user_id=uid).order_by(Notification.created_at.desc()).all()
    return jsonify([r.to_dict() for r in rows])


@notifs_bp.route('/<int:note_id>/read', methods=['POST'])
@jwt_required()
def mark_read(note_id):
    uid = int(get_jwt_identity())
    note = Notification.query.get(note_id)
    if not note or note.user_id != uid:
        return jsonify({'error': 'Not found'}), 404
    note.read = True
    db.session.commit()
    return jsonify({'ok': True})


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


# Note: single endpoint for marking a notification read is defined earlier as
# @notifs_bp.route('/<int:note_id>/read', methods=['POST']) -> mark_read(note_id)
# keep that implementation for compatibility with frontend API.


@notifs_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    uid = int(get_jwt_identity())
    Notification.query.filter_by(user_id=uid, read=False).update({'read': True})
    db.session.commit()
    return jsonify({'ok': True})


@notifs_bp.route('/stream', methods=['GET'])
def stream_notifications():
    # Support token via query param for EventSource clients: /api/notifications/stream?access_token=...
    token = request.args.get('access_token') or request.args.get('token')
    if token:
        request.environ['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    uid = int(get_jwt_identity())

    def gen():
        last_id = 0
        while True:
            rows = (
                Notification.query.filter(Notification.user_id == uid, Notification.id > last_id)
                .order_by(Notification.id)
                .all()
            )
            for r in rows:
                last_id = max(last_id, r.id)
                yield f"data: {json.dumps(r.to_dict())}\n\n"
            time.sleep(1)

    return Response(stream_with_context(gen()), mimetype='text/event-stream')


def push_notification(user_id, title, body, notif_type='info'):
    """Helper for other routes to enqueue notifications."""
    notif = Notification(user_id=user_id, title=title, body=body, type=notif_type)
    db.session.add(notif)
    db.session.commit()
    # Emit via Socket.IO to the user's room if connected
    try:
        socketio.emit('notification', notif.to_dict(), room=f'user_{user_id}')
    except Exception:
        pass
    return notif


@socketio.on('connect')
def handle_connect():
    # Expect token via query string: ?token=...
    token = request.args.get('token') or request.args.get('access_token')
    if not token:
        disconnect()
        return
    try:
        decoded = decode_token(token)
        uid = int(decoded.get('sub'))
        join_room(f'user_{uid}')
    except Exception:
        disconnect()
