from models.db import db
from datetime import datetime


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id              = db.Column(db.Integer, primary_key=True)
    title           = db.Column(db.String(200), nullable=False)
    category        = db.Column(db.String(30), default="grammar")
    # grammar | vocab | listening | reading | speaking | mock_ielts
    difficulty      = db.Column(db.String(20), default="intermediate")
    time_limit_min  = db.Column(db.Integer, default=10)
    created_by      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship("QuizQuestion", backref="quiz", lazy=True, cascade="all,delete")
    attempts  = db.relationship("QuizAttempt",  backref="quiz", lazy=True, cascade="all,delete")

    def to_dict(self, include_questions=False):
        d = {
            "id":             self.id,
            "title":          self.title,
            "category":       self.category,
            "difficulty":     self.difficulty,
            "time_limit_min": self.time_limit_min,
            "question_count": len(self.questions),
        }
        if include_questions:
            d["questions"] = [q.to_dict() for q in self.questions]
        return d


class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"

    id            = db.Column(db.Integer, primary_key=True)
    quiz_id       = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    question      = db.Column(db.Text, nullable=False)
    options       = db.Column(db.Text, nullable=False)   # pipe-separated: A|B|C|D
    correct_index = db.Column(db.Integer, nullable=False)
    explanation   = db.Column(db.Text, default="")

    def to_dict(self):
        return {
            "id":            self.id,
            "question":      self.question,
            "options":       self.options.split("|"),
            "correct_index": self.correct_index,
            "explanation":   self.explanation,
        }


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id          = db.Column(db.Integer, primary_key=True)
    quiz_id     = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    student_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    answers     = db.Column(db.String(200), default="")   # comma-separated indices
    score       = db.Column(db.Integer, default=0)        # percentage 0-100
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "quiz_id":      self.quiz_id,
            "score":        self.score,
            "attempted_at": self.attempted_at.isoformat(),
        }