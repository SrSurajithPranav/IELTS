from models.db import db
from datetime import datetime

class StudentPlan(db.Model):
    __tablename__ = 'student_plans'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)
    start_date = db.Column(db.Date, default=lambda: datetime.utcnow().date())
    due_date = db.Column(db.Date, nullable=True)
    reminder_days = db.Column(db.Integer, default=3)
    reminder_sent_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    def current_day(self):
        if not self.start_date:
            return 0
        return max((datetime.utcnow().date() - self.start_date).days + 1, 1)

    def days_remaining(self):
        if not self.due_date:
            return None
        return (self.due_date - datetime.utcnow().date()).days

    def needs_reminder(self):
        remaining = self.days_remaining()
        if remaining is None or self.reminder_sent_at:
            return False
        threshold = max(self.reminder_days or 0, 0)
        return remaining <= threshold

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'plan_id': self.plan_id,
            'start_date': str(self.start_date),
            'due_date': str(self.due_date) if self.due_date else None,
            'reminder_days': self.reminder_days,
            'reminder_sent_at': self.reminder_sent_at.isoformat() if self.reminder_sent_at else None,
            'is_active': self.is_active
        }
