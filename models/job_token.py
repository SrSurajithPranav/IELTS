from datetime import datetime, timedelta
import secrets
from models.db import db


class ReviewJobToken(db.Model):
    __tablename__ = 'review_job_tokens'

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def generate(cls, creator_id, name=None, days_valid=7):
        t = secrets.token_hex(24)
        exp = datetime.utcnow() + timedelta(days=days_valid) if days_valid else None
        obj = cls(token=t, name=name, created_by=creator_id, expires_at=exp)
        db.session.add(obj)
        db.session.commit()
        return obj

    def is_valid(self):
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True
