from models.db import db
from datetime import datetime

class Vocabulary(db.Model):
    __tablename__ = 'vocabulary'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    word = db.Column(db.String(100), nullable=False)
    definition = db.Column(db.Text, nullable=False)
    example = db.Column(db.Text, nullable=True)
    mastered = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'word': self.word,
            'definition': self.definition,
            'example': self.example,
            'mastered': self.mastered,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
