from models.db import db
from datetime import datetime

class Plan(db.Model):
    __tablename__ = 'plans'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    session_type = db.Column(db.String(50), default='solo')  # solo | batch_small | batch_medium | batch_large
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tasks = db.relationship('Task', backref='plan', lazy=True)
    student_plans = db.relationship('StudentPlan', backref='plan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'duration_days': self.duration_days,
            'session_type': self.session_type,
            'description': self.description
        }
