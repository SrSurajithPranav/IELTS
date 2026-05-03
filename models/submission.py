from models.db import db
from datetime import datetime

class Submission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)          # text or Cloudinary URL
    file_url = db.Column(db.String(500), nullable=True)  # Cloudinary URL for audio
    status = db.Column(db.String(20), default='submitted')  # submitted | reviewed
    feedback_text = db.Column(db.Text, nullable=True)
    feedback_audio_url = db.Column(db.String(500), nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'task_id': self.task_id,
            'task': {
                'id': self.task.id,
                'type': self.task.type,
                'title': self.task.title,
                'day_number': self.task.day_number,
            } if self.task else None,
            'content': self.content,
            'file_url': self.file_url,
            'status': self.status,
            'feedback_text': self.feedback_text,
            'feedback_audio_url': self.feedback_audio_url,
            'submitted_at': self.submitted_at.isoformat(),
            'reviewed_at': str(self.reviewed_at) if self.reviewed_at else None
        }
