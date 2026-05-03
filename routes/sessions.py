"""
routes/sessions.py
Live session management using Jitsi Meet (100% free, no account needed).
Group sessions get a shared room. Solo sessions get a private room.
Recorded sessions stored as Cloudinary URLs.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.session import LiveSession, SessionRecording
from models.user import User
from datetime import datetime
import secrets

sessions_bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")


def _jitsi_room(name: str) -> str:
    """Generate a Jitsi Meet URL. Free, no signup, works in browser."""
    safe = name.lower().replace(" ", "-")
    return f"https://meet.jit.si/ielts-{safe}"


@sessions_bp.route("/", methods=["POST"])
@jwt_required()
def create_session():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    room_token = secrets.token_hex(4)
    room_name = f"{data.get('title', 'class').replace(' ','-')}-{room_token}"

    session = LiveSession(
        title=data["title"],
        host_id=uid,
        batch_id=data.get("batch_id"),
        student_id=data.get("student_id"),   # for solo
        session_type=data.get("session_type", "group"),  # group | solo
        scheduled_at=datetime.fromisoformat(data["scheduled_at"]) if data.get("scheduled_at") else datetime.utcnow(),
        jitsi_room=room_name,
        jitsi_url=_jitsi_room(room_name),
        topic=data.get("topic", ""),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@sessions_bp.route("/", methods=["GET"])
@jwt_required()
def list_sessions():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role == "admin":
        sessions = LiveSession.query.order_by(LiveSession.scheduled_at.desc()).all()
    else:
        # student sees their batch sessions + solo sessions assigned to them
        from models.batch import BatchMember
        batch_ids = [m.batch_id for m in BatchMember.query.filter_by(student_id=uid).all()]
        sessions = LiveSession.query.filter(
            db.or_(
                LiveSession.student_id == uid,
                LiveSession.batch_id.in_(batch_ids)
            )
        ).order_by(LiveSession.scheduled_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@sessions_bp.route("/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    session = LiveSession.query.get_or_404(session_id)
    return jsonify(session.to_dict())


@sessions_bp.route("/<int:session_id>/recording", methods=["POST"])
@jwt_required()
def add_recording(session_id):
    """Teacher uploads/links a recording after the session."""
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    rec = SessionRecording(
        session_id=session_id,
        title=data.get("title", "Session Recording"),
        url=data["url"],          # Cloudinary URL or YouTube/Drive link
        duration_min=data.get("duration_min", 0),
        uploaded_by=uid,
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201


@sessions_bp.route("/recordings", methods=["GET"])
@jwt_required()
def list_recordings():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role == "admin":
        recs = SessionRecording.query.order_by(SessionRecording.id.desc()).all()
    else:
        from models.batch import BatchMember
        batch_ids = [m.batch_id for m in BatchMember.query.filter_by(student_id=uid).all()]
        session_ids = [s.id for s in LiveSession.query.filter(
            db.or_(LiveSession.student_id == uid, LiveSession.batch_id.in_(batch_ids))
        ).all()]
        recs = SessionRecording.query.filter(SessionRecording.session_id.in_(session_ids)).all()
    return jsonify([r.to_dict() for r in recs])