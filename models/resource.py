from models.db import db
from datetime import datetime


class Resource(db.Model):
    __tablename__ = "resources"

    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(200), nullable=False)
    description  = db.Column(db.Text, default="")
    category     = db.Column(db.String(30), default="general")
    # speaking | writing | listening | reading | grammar | vocab | general
    type         = db.Column(db.String(20), default="link")
    # link | pdf | video | audio
    url          = db.Column(db.String(500), nullable=False)
    uploaded_by  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "category":    self.category,
            "type":        self.type,
            "url":         self.url,
            "created_at":  self.created_at.isoformat(),
        }