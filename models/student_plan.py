from models.db import db
from datetime import datetime

class StudentPlan(db.Model):
    __tablename__ = 'student_plans'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)
    start_date = db.Column(db.Date, default=lambda: datetime.utcnow().date())
    is_active = db.Column(db.Boolean, default=True)

    def current_day(self):
        if not self.start_date:
            return 0
        return max((datetime.utcnow().date() - self.start_date).days + 1, 1)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'plan_id': self.plan_id,
            'start_date': str(self.start_date),
            'is_active': self.is_active
        }
