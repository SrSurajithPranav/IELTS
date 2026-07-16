from models.db import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')  # student | admin
    score = db.Column(db.Float, default=0)
    streak = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date, nullable=True)
    weak_areas = db.Column(db.String(500), default='')  # comma-separated
    zoom_link = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    submissions = db.relationship('Submission', backref='student', lazy=True)
    student_plans = db.relationship('StudentPlan', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'score': self.score,
            'streak': self.streak,
            'weak_areas': self.weak_areas.split(',') if self.weak_areas else [],
            'zoom_link': self.zoom_link,
            'listening_band': 7.0,
            'reading_band': 6.5,
            'writing_band': 6.0,
            'speaking_band': 6.5,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
