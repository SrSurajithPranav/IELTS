"""
routes/quizzes.py  +  routes/resources.py combined
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.quiz import Quiz, QuizQuestion, QuizAttempt
from models.resource import Resource
from models.user import User
from utils.scraper import scrape_public_page

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api/quizzes")
resources_bp = Blueprint("resources", __name__, url_prefix="/api/resources")


# ── QUIZZES ───────────────────────────────────────────────────────────

@quizzes_bp.route("/", methods=["GET"])
@jwt_required()
def list_quizzes():
    category = request.args.get("category")   # grammar|vocab|listening|reading|mock
    q = Quiz.query
    if category:
        q = q.filter_by(category=category)
    return jsonify([quiz.to_dict() for quiz in q.order_by(Quiz.id.desc()).all()])


@quizzes_bp.route("/", methods=["POST"])
@jwt_required()
def create_quiz():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    data = request.get_json()
    quiz = Quiz(
        title=data["title"],
        category=data.get("category", "grammar"),
        difficulty=data.get("difficulty", "intermediate"),
        time_limit_min=data.get("time_limit_min", 10),
        created_by=uid,
    )
    db.session.add(quiz)
    db.session.flush()
    for q in data.get("questions", []):
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question=q["question"],
            options="|".join(q["options"]),   # pipe-separated
            correct_index=q["correct"],
            explanation=q.get("explanation", ""),
        )
        db.session.add(qq)
    db.session.commit()
    return jsonify(quiz.to_dict(include_questions=True)), 201


@quizzes_bp.route("/<int:quiz_id>", methods=["GET"])
@jwt_required()
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify(quiz.to_dict(include_questions=True))


@quizzes_bp.route("/<int:quiz_id>/attempt", methods=["POST"])
@jwt_required()
def submit_attempt(quiz_id):
    uid = get_jwt_identity()
    data = request.get_json()
    answers = data.get("answers", [])  # list of chosen option indices
    questions = QuizQuestion.query.filter_by(quiz_id=quiz_id).all()

    score = sum(
        1 for i, q in enumerate(questions)
        if i < len(answers) and answers[i] == q.correct_index
    )
    pct = round((score / len(questions)) * 100) if questions else 0

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=uid,
        answers=",".join(str(a) for a in answers),
        score=pct,
    )
    db.session.add(attempt)
    db.session.commit()
    return jsonify({
        "score": pct,
        "correct": score,
        "total": len(questions),
        "results": [
            {
                "question": q.question,
                "your_answer": answers[i] if i < len(answers) else -1,
                "correct_answer": q.correct_index,
                "explanation": q.explanation,
                "options": q.options.split("|"),
            }
            for i, q in enumerate(questions)
        ]
    })


@quizzes_bp.route("/attempts/me", methods=["GET"])
@jwt_required()
def my_attempts():
    uid = get_jwt_identity()
    attempts = QuizAttempt.query.filter_by(student_id=uid).order_by(QuizAttempt.id.desc()).all()
    return jsonify([a.to_dict() for a in attempts])


# ── RESOURCES ─────────────────────────────────────────────────────────

@resources_bp.route("/", methods=["GET"])
@jwt_required()
def list_resources():
    category = request.args.get("category")
    q = Resource.query
    if category:
        q = q.filter_by(category=category)
    return jsonify([r.to_dict() for r in q.order_by(Resource.id.desc()).all()])


@resources_bp.route("/", methods=["POST"])
@jwt_required()
def create_resource():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    data = request.get_json()
    resource = Resource(
        title=data["title"],
        category=data.get("category", "general"),  # speaking|writing|listening|reading|grammar|general
        type=data.get("type", "link"),              # link|pdf|video|audio
        url=data["url"],
        description=data.get("description", ""),
        uploaded_by=uid,
    )
    db.session.add(resource)
    db.session.commit()
    return jsonify(resource.to_dict()), 201


@resources_bp.route("/scrape", methods=["POST"])
@jwt_required()
def scrape_resource():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json() or {}
    url = data.get("url")
    category = data.get("category", "general")
    resource_type = data.get("type", "link")
    if not url:
        return jsonify({"error": "url is required"}), 400

    scraped = scrape_public_page(url)
    resource = Resource.query.filter_by(url=url).first()
    if resource:
        resource.title = scraped["title"]
        resource.description = scraped["description"]
        resource.category = category
        resource.type = resource_type
    else:
        resource = Resource(
            title=scraped["title"],
            category=category,
            type=resource_type,
            url=url,
            description=scraped["description"],
            uploaded_by=uid,
        )
        db.session.add(resource)
    db.session.commit()

    return jsonify({"resource": resource.to_dict(), "links": scraped["links"]}), 201


@resources_bp.route("/scrape/seed", methods=["POST"])
@jwt_required()
def scrape_seed_resources():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    sources = [
        {
            "url": "https://www.ielts.org/for-test-takers/sample-test-questions",
            "category": "general",
            "type": "link",
        },
        {
            "url": "https://ieltsliz.com/",
            "category": "general",
            "type": "link",
        },
    ]

    imported = []
    for source in sources:
        try:
            scraped = scrape_public_page(source["url"])
        except Exception:
            continue

        resource = Resource.query.filter_by(url=source["url"]).first()
        if resource:
            resource.title = scraped["title"]
            resource.description = scraped["description"]
            resource.category = source["category"]
            resource.type = source["type"]
        else:
            resource = Resource(
                title=scraped["title"],
                description=scraped["description"],
                category=source["category"],
                type=source["type"],
                url=source["url"],
                uploaded_by=uid,
            )
            db.session.add(resource)
        imported.append(resource)

    db.session.commit()
    return jsonify({"imported": [r.to_dict() for r in imported]}), 201


@resources_bp.route("/<int:resource_id>", methods=["DELETE"])
@jwt_required()
def delete_resource(resource_id):
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    r = Resource.query.get_or_404(resource_id)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Deleted"})