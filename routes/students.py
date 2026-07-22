"""
routes/students.py
Teacher/admin: create students, list them, reset password, update, delete.
Each teacher only sees and manages their own students.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from models.db import db
from models.user import User
from models.student_plan import StudentPlan
from datetime import datetime
from flask import current_app

students_bp = Blueprint("students", __name__, url_prefix="/api/students")


@students_bp.route("/", methods=["POST"])
@jwt_required()
def create_student():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role not in ("admin", "teacher"):
        return jsonify({"error": "Admin/Teacher only"}), 403

    data = request.get_json(silent=True) or {}
    for field in ("name", "email", "password"):
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    student = User(
        name=data["name"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
        role="student",
        zoom_link=data.get("zoom_link", ""),
        # Link new student to the creating teacher automatically
        teacher_id=uid if user.role == "teacher" else data.get("teacher_id"),
    )
    db.session.add(student)
    db.session.commit()

    if data.get("plan_id"):
        sp = StudentPlan(
            student_id=student.id,
            plan_id=data["plan_id"],
            start_date=datetime.utcnow().date(),
        )
        db.session.add(sp)
        db.session.commit()

    return jsonify({
        "message": "Student created",
        "student": student.to_dict(),
        "login_credentials": {"email": student.email, "password": data["password"]},
    }), 201


@students_bp.route("/", methods=["GET"])
@jwt_required()
def list_students():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    current_app.logger.info(f"list_students called by uid={uid} role={getattr(user,'role',None)}")
    if not user or user.role not in ("admin", "teacher"):
        return jsonify({"error": "Admin/Teacher only"}), 403

    if user.role == "admin":
        students = User.query.filter_by(role="student").order_by(User.created_at.desc()).all()
    else:
        # Teacher: own students first; fall back to unassigned if they have none yet
        own = User.query.filter_by(role="student", teacher_id=uid).order_by(User.created_at.desc()).all()
        students = own if own else User.query.filter_by(role="student", teacher_id=None).order_by(User.created_at.desc()).all()

    result = []
    for s in students:
        d  = s.to_dict()
        sp = StudentPlan.query.filter_by(student_id=s.id, is_active=True).first()
        d["current_day"] = sp.current_day() if sp else 0
        d["plan_id"]     = sp.plan_id if sp else None
        result.append(d)
    return jsonify(result)


@students_bp.route("/<int:student_id>/reset-password", methods=["POST"])
@jwt_required()
def reset_password(student_id):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role not in ("admin", "teacher"):
        return jsonify({"error": "Admin/Teacher only"}), 403
    data     = request.get_json(silent=True) or {}
    new_pass = data.get("password")
    if not new_pass or len(new_pass) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    student          = User.query.get_or_404(student_id)
    student.password = generate_password_hash(new_pass)
    db.session.commit()
    return jsonify({"message": "Password updated", "email": student.email, "password": new_pass})


@students_bp.route("/<int:student_id>", methods=["PATCH"])
@jwt_required()
def update_student(student_id):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role not in ("admin", "teacher"):
        return jsonify({"error": "Admin/Teacher only"}), 403
    student = User.query.get_or_404(student_id)
    data    = request.get_json(silent=True) or {}

    for field in ("name", "zoom_link", "weak_areas", "estimated_score"):
        if field in data:
            if field == "weak_areas" and isinstance(data[field], list):
                student.weak_areas = ",".join(data[field])
            else:
                setattr(student, field, data[field])

    if "plan_id" in data:
        plan_id  = data["plan_id"]
        existing = StudentPlan.query.filter_by(student_id=student_id, is_active=True).first()
        if existing:
            existing.is_active = False
        if plan_id:
            db.session.add(StudentPlan(
                student_id=student_id,
                plan_id=int(plan_id),
                start_date=datetime.utcnow().date(),
                is_active=True,
            ))

    db.session.commit()
    result            = student.to_dict()
    sp                = StudentPlan.query.filter_by(student_id=student_id, is_active=True).first()
    result["plan_id"] = sp.plan_id if sp else None
    return jsonify(result)


@students_bp.route("/<int:student_id>", methods=["DELETE"])
@jwt_required()
def delete_student(student_id):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role not in ("admin", "teacher"):
        return jsonify({"error": "Admin/Teacher only"}), 403
    student = User.query.get_or_404(student_id)
    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "Student deleted"})
