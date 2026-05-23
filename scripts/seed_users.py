#!/usr/bin/env python3
"""Seed script: create sample teachers and students for local testing."""
from app import create_app
from models.db import db
from models.user import User
from werkzeug.security import generate_password_hash

app = create_app('development')

users = [
    ('admin@test.com', 'Admin', 'admin123', 'admin'),
    ('teacher1@test.com', 'Teacher One', 'teacher123', 'teacher'),
    ('student1@test.com', 'Student One', 'student123', 'student'),
    ('student2@test.com', 'Student Two', 'student234', 'student'),
]

with app.app_context():
    db.create_all()
    for email, name, pwd, role in users:
        existing = User.query.filter_by(email=email).first()
        if existing:
            print('Skipping existing:', email)
            continue
        u = User(name=name, email=email, password=generate_password_hash(pwd), role=role)
        db.session.add(u)
        db.session.commit()
        print('Created', role, email)

    print('Seeding complete')
