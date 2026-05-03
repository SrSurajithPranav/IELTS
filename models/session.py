"""
models/session.py  — Live sessions + recordings
"""
from models.db import db
from datetime import datetime


class LiveSession(db.Model):
    __tablename__ = "live_sessions"

    id            = db.Column(db.Integer, primary_key=True)
    title         = db.Column(db.String(200), nullable=False)
    topic         = db.Column(db.String(300), nullable=True)
    host_id       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    batch_id      = db.Column(db.Integer, db.ForeignKey("batches.id"), nullable=True)
    student_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # solo
    session_type  = db.Column(db.String(20), default="group")   # group | solo
    jitsi_room    = db.Column(db.String(200), nullable=False)
    jitsi_url     = db.Column(db.String(500), nullable=False)
    scheduled_at  = db.Column(db.DateTime, default=datetime.utcnow)
    status        = db.Column(db.String(20), default="scheduled")  # scheduled|live|ended
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    recordings    = db.relationship("SessionRecording", backref="session", lazy=True, cascade="all,delete")

    def to_dict(self):
        return {
            "id":           self.id,
            "title":        self.title,
            "topic":        self.topic,
            "host_id":      self.host_id,
            "batch_id":     self.batch_id,
            "student_id":   self.student_id,
            "session_type": self.session_type,
            "jitsi_room":   self.jitsi_room,
            "jitsi_url":    self.jitsi_url,
            "scheduled_at": self.scheduled_at.isoformat(),
            "status":       self.status,
            "recordings":   [r.to_dict() for r in self.recordings],
        }


class SessionRecording(db.Model):
    __tablename__ = "session_recordings"

    id           = db.Column(db.Integer, primary_key=True)
    session_id   = db.Column(db.Integer, db.ForeignKey("live_sessions.id"), nullable=False)
    title        = db.Column(db.String(200), nullable=False)
    url          = db.Column(db.String(500), nullable=False)   # Cloudinary / YouTube / Drive
    duration_min = db.Column(db.Integer, default=0)
    uploaded_by  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    uploaded_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "session_id":   self.session_id,
            "title":        self.title,
            "url":          self.url,
            "duration_min": self.duration_min,
            "uploaded_at":  self.uploaded_at.isoformat(),
        }