from models.db import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student')  # student | teacher | admin
    score = db.Column(db.Float, default=0)
    streak = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date, nullable=True)
    weak_areas = db.Column(db.String(500), default='')
    zoom_link = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Teacher–student linking (nullable so existing data is unaffected)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Per-skill band scores — null until teacher reviews a submission
    listening_band = db.Column(db.Float, nullable=True)
    reading_band   = db.Column(db.Float, nullable=True)
    writing_band   = db.Column(db.Float, nullable=True)
    speaking_band  = db.Column(db.Float, nullable=True)

    submissions   = db.relationship('Submission', backref='student',
                                    foreign_keys='Submission.student_id', lazy=True)
    student_plans = db.relationship('StudentPlan', backref='student', lazy=True)

    def compute_bands(self):
        """Recompute per-skill band averages from reviewed submissions."""
        from models.submission import Submission
        reviewed = Submission.query.filter_by(
            student_id=self.id, status='reviewed'
        ).all()

        buckets = {'listening': [], 'reading': [], 'writing': [], 'speaking': []}
        for sub in reviewed:
            if sub.band_score is None:
                continue
            skill = (sub.task.type if sub.task else '').lower().strip()
            if skill in buckets:
                buckets[skill].append(sub.band_score)

        def avg(lst):
            return round(sum(lst) / len(lst), 1) if lst else None

        self.listening_band = avg(buckets['listening'])
        self.reading_band   = avg(buckets['reading'])
        self.writing_band   = avg(buckets['writing'])
        self.speaking_band  = avg(buckets['speaking'])

        rated = [v for v in [
            self.listening_band, self.reading_band,
            self.writing_band,   self.speaking_band,
        ] if v is not None]
        self.score = round(sum(rated) / len(rated), 1) if rated else 0

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'score': self.score,
            'streak': self.streak,
            'weak_areas': self.weak_areas.split(',') if self.weak_areas else [],
            'zoom_link': self.zoom_link,
            'teacher_id': self.teacher_id,
            'listening_band': self.listening_band,
            'reading_band':   self.reading_band,
            'writing_band':   self.writing_band,
            'speaking_band':  self.speaking_band,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
