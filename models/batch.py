from models.db import db
from datetime import datetime

class Batch(db.Model):
    __tablename__ = 'batches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    zoom_link = db.Column(db.String(500), nullable=True)
    schedule = db.Column(db.String(200), nullable=True)  # e.g. "Mon,Wed,Fri 7PM IST"
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    members = db.relationship('BatchMember', backref='batch', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'zoom_link': self.zoom_link,
            'schedule': self.schedule,
            'plan_id': self.plan_id
        }

class BatchMember(db.Model):
    __tablename__ = 'batch_members'
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('batches.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
