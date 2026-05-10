from models.db import db

class Mistake(db.Model):
    __tablename__ = 'mistakes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    error_text = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # grammar, vocabulary, spelling
    frequency = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'error_text': self.error_text,
            'category': self.category,
            'frequency': self.frequency,
        }
