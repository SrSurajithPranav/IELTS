from datetime import datetime
from models.db import db


class ReviewAudit(db.Model):
    __tablename__ = 'review_audits'

    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_count = db.Column(db.Integer, default=0)
    min_frequency = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'student_id': self.student_id,
            'quiz_id': self.quiz_id,
            'question_count': self.question_count,
            'min_frequency': self.min_frequency,
            'category': self.category,
            'created_at': self.created_at.isoformat(),
        }
