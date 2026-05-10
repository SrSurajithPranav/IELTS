from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.announcement import Announcement
from models.user import User
from datetime import datetime

announcements_bp = Blueprint('announcements', __name__, url_prefix='/api/announcements')


@announcements_bp.route('/', methods=['GET'])
@jwt_required()
def get_active():
    now = datetime.utcnow()
    anns = Announcement.query.filter(
        (Announcement.expires_at == None) | (Announcement.expires_at > now)
    ).order_by(Announcement.created_at.desc()).all()
    return jsonify([a.to_dict() for a in anns])


@announcements_bp.route('/', methods=['POST'])
@jwt_required()
def create():
    uid = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user or getattr(user, 'role', None) != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    data = request.get_json() or {}
    ann = Announcement(
        title=data.get('title', ''),
        content=data.get('content', ''),
        expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None
    )
    db.session.add(ann)
    db.session.commit()
    return jsonify({'id': ann.id, 'message': 'Announcement posted'}), 201
