from models.db import db

class SpeakingTopic(db.Model):
    __tablename__ = 'speaking_topics'
    id = db.Column(db.Integer, primary_key=True)
    part = db.Column(db.Integer, nullable=False)  # 1,2,3
    question = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'part': self.part,
            'question': self.question,
            'created_by': self.created_by,
        }
