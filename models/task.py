from models.db import db

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(30), nullable=False)  # speaking|writing|listening|reading|grammar
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration = db.Column(db.String(30), default='20 min')
    difficulty = db.Column(db.String(20), default='intermediate')
    submissions = db.relationship('Submission', backref='task', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'plan_id': self.plan_id,
            'day_number': self.day_number,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'duration': self.duration,
            'difficulty': self.difficulty
        }
