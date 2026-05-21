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
import random

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api/quizzes")
resources_bp = Blueprint("resources", __name__, url_prefix="/api/resources")

QUIZ_CATEGORY_ALIASES = {
    "learning": ["learning", "general", "grammar", "vocab"],
    "reading": ["reading", "general"],
    "listening": ["listening", "general"],
    "writing": ["writing", "general"],
}

FALLBACK_QUESTION_BANK = {
    "reading": [
        {
            "question": "A passage states that city bike-share usage rose 42% after new lanes were added. What is the best inference?",
            "options": [
                "Infrastructure changes can influence commuter behavior",
                "Bike-share is always cheaper than buses",
                "Private car ownership dropped to zero",
                "Weather has no impact on transport choices",
            ],
            "correct": 0,
            "explanation": "The statement links improved infrastructure with higher usage.",
        },
        {
            "question": "In IELTS Reading, which strategy usually helps with True/False/Not Given questions?",
            "options": [
                "Match exact meaning, not just matching words",
                "Read options before the passage only",
                "Skip all unfamiliar vocabulary",
                "Choose True when unsure",
            ],
            "correct": 0,
            "explanation": "Paraphrase detection and meaning matching are key for this question type.",
        },
    ],
    "listening": [
        {
            "question": "A speaker says: 'The seminar starts at quarter past nine, not nine-thirty.' What time should you write?",
            "options": ["9:05", "9:15", "9:30", "9:45"],
            "correct": 1,
            "explanation": "Quarter past nine equals 9:15.",
        },
        {
            "question": "Which listening skill is most useful for IELTS Section 1 form completion?",
            "options": [
                "Accurate spelling and number recognition",
                "Advanced literary analysis",
                "Long essay planning",
                "Memorizing all synonyms beforehand",
            ],
            "correct": 0,
            "explanation": "Section 1 often tests practical details like names, numbers, and spelling.",
        },
    ],
    "writing": [
        {
            "question": "For IELTS Writing Task 2, which structure is strongest?",
            "options": [
                "Clear introduction, body paragraphs with topic sentences, concise conclusion",
                "One long paragraph with all ideas",
                "Bullet points only",
                "Copying the prompt and adding personal stories",
            ],
            "correct": 0,
            "explanation": "Logical structure and clear argument progression improve coherence and cohesion.",
        },
        {
            "question": "What improves Lexical Resource score in Writing?",
            "options": [
                "Using varied and precise vocabulary naturally",
                "Repeating the same words for clarity",
                "Using slang and abbreviations",
                "Writing very short sentences only",
            ],
            "correct": 0,
            "explanation": "Accurate variety and precision are rewarded more than forced complexity.",
        },
    ],
    "learning": [
        {
            "question": "Which weekly plan best supports IELTS progress?",
            "options": [
                "Balanced practice across reading, listening, writing, and speaking",
                "Only mock tests every day",
                "Only grammar drills for a month",
                "No revision, only new content",
            ],
            "correct": 0,
            "explanation": "Balanced skill coverage with review is more sustainable and effective.",
        },
        {
            "question": "What is the most useful way to use feedback?",
            "options": [
                "Convert repeated mistakes into targeted drills",
                "Ignore low-scoring sections",
                "Switch strategy daily",
                "Focus only on strengths",
            ],
            "correct": 0,
            "explanation": "Deliberate practice on recurring errors improves score consistency.",
        },
    ],
}

PRIVATE_SEED_RESOURCES = [
    {
        "title": "Reading: Urban Transport Passage Pack",
        "description": "Passages on city planning, commuter trends, and transport policy.",
        "category": "reading",
        "type": "link",
        "url": "internal://reading/urban-transport-pack",
    },
    {
        "title": "Reading: Science & Environment Pack",
        "description": "Academic-style passages focused on climate, ecology, and public health.",
        "category": "reading",
        "type": "link",
        "url": "internal://reading/science-environment-pack",
    },
    {
        "title": "Listening: Campus Conversations Set",
        "description": "Short dialogs with dates, spellings, numbers, and booking details.",
        "category": "listening",
        "type": "audio",
        "url": "internal://listening/campus-conversations-set",
    },
    {
        "title": "Listening: Lecture Notes Challenge",
        "description": "Long-form monologues for note completion and idea tracking.",
        "category": "listening",
        "type": "audio",
        "url": "internal://listening/lecture-notes-challenge",
    },
    {
        "title": "Writing: Task 2 Argument Bank",
        "description": "Opinion and discussion prompts with model structure hints.",
        "category": "writing",
        "type": "link",
        "url": "internal://writing/task2-argument-bank",
    },
    {
        "title": "Writing: Task 1 Data Report Drills",
        "description": "Trend, comparison, and overview practice with chart descriptions.",
        "category": "writing",
        "type": "link",
        "url": "internal://writing/task1-data-report-drills",
    },
    {
        "title": "Learning: Weekly Strategy Blueprint",
        "description": "Skill-rotation schedule to improve consistency across all modules.",
        "category": "learning",
        "type": "link",
        "url": "internal://learning/weekly-strategy-blueprint",
    },
    {
        "title": "Learning: Mistake Log & Review Cycle",
        "description": "Framework to convert weak areas into targeted practice tasks.",
        "category": "learning",
        "type": "link",
        "url": "internal://learning/mistake-log-review-cycle",
    },
]


def _normalized_category(value):
    raw = (value or "learning").strip().lower()
    return raw if raw in QUIZ_CATEGORY_ALIASES else "learning"


def _resource_categories_for(category):
    return QUIZ_CATEGORY_ALIASES.get(category, ["general"])


def _ensure_private_seed_resources(uid):
    created = False
    for item in PRIVATE_SEED_RESOURCES:
        existing = Resource.query.filter_by(url=item["url"]).first()
        if existing:
            continue
        db.session.add(
            Resource(
                title=item["title"],
                description=item["description"],
                category=item["category"],
                type=item["type"],
                url=item["url"],
                uploaded_by=uid,
            )
        )
        created = True
    if created:
        db.session.flush()


def _resource_based_questions(category, question_count):
    resources = Resource.query.filter(Resource.category.in_(_resource_categories_for(category))).all()
    if len(resources) < 4:
        return []

    questions = []
    for _ in range(question_count):
        option_set = random.sample(resources, k=min(4, len(resources)))
        answer = random.choice(option_set)
        random.shuffle(option_set)
        correct_index = next((idx for idx, item in enumerate(option_set) if item.id == answer.id), 0)
        focus = category.capitalize()
        questions.append(
            {
                "question": f"For {focus} practice, which resource is the best match for this drill: {answer.description or answer.title}?",
                "options": [item.title for item in option_set],
                "correct": correct_index,
                "explanation": f"{answer.title} is the best match. Use it here: {answer.url}",
            }
        )
    return questions


def _fallback_questions(category, question_count):
    bank = FALLBACK_QUESTION_BANK.get(category, FALLBACK_QUESTION_BANK["learning"])
    if question_count <= len(bank):
        return random.sample(bank, question_count)

    # Repeat bank when more questions are requested than currently available.
    repeated = []
    while len(repeated) < question_count:
        repeated.extend(random.sample(bank, len(bank)))
    return repeated[:question_count]


def _preferred_categories_from_weak_areas(weak_areas):
    categories = []
    for area in weak_areas or []:
        text = (area or '').lower()
        if 'read' in text and 'reading' not in categories:
            categories.append('reading')
        if 'listen' in text and 'listening' not in categories:
            categories.append('listening')
        if 'write' in text and 'writing' not in categories:
            categories.append('writing')
        if ('learn' in text or 'strategy' in text or 'plan' in text) and 'learning' not in categories:
            categories.append('learning')
        if ('grammar' in text or 'vocab' in text or 'word' in text) and 'learning' not in categories:
            categories.append('learning')
    return categories or ['learning', 'reading', 'listening', 'writing']


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
    uid = int(get_jwt_identity())
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


@quizzes_bp.route("/generate-random", methods=["POST"])
@jwt_required()
def generate_random_quiz():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json(silent=True) or {}
    category = _normalized_category(data.get("category"))
    difficulty = (data.get("difficulty") or "intermediate").strip().lower()
    try:
        question_count = int(data.get("question_count", 8))
    except (TypeError, ValueError):
        question_count = 8
    question_count = max(4, min(20, question_count))
    title = (data.get("title") or f"{category.capitalize()} Random IELTS Quiz").strip()
    try:
        time_limit = int(data.get("time_limit_min", 12))
    except (TypeError, ValueError):
        time_limit = 12
    time_limit = max(5, min(60, time_limit))

    _ensure_private_seed_resources(uid)

    # Special-case: full mock IELTS quiz with one question from each core skill
    if category == 'mock_ielts' or (data.get('structure') or '').strip().lower() == 'one_each':
        desired = ['reading', 'writing', 'listening', 'speaking']
        generated_questions = []
        for cat in desired:
            qlist = _resource_based_questions(cat, 1)
            if not qlist:
                qlist = _fallback_questions(cat, 1)
            if qlist:
                # tag question with its skill
                item = qlist[0]
                item.setdefault('meta', {})['skill'] = cat
                generated_questions.append(item)
        # If somehow fewer than 4 were generated, fill the rest from fallback learning bank
        if len(generated_questions) < 4:
            more = _fallback_questions('learning', 4 - len(generated_questions))
            generated_questions.extend(more)
        # Respect the supplied title or create a sensible default
        if not title:
            title = f"Full IELTS Mock ({difficulty.capitalize()})"
        # Override the question count to actual generated length
        question_count = len(generated_questions)
    else:
        generated_questions = _resource_based_questions(category, question_count)
        if len(generated_questions) < question_count:
            generated_questions = _fallback_questions(category, question_count)

    quiz = Quiz(
        title=title,
        category=category,
        difficulty=difficulty,
        time_limit_min=time_limit,
        created_by=uid,
    )
    db.session.add(quiz)
    db.session.flush()

    for item in generated_questions:
        db.session.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question=item["question"],
                options="|".join(item["options"]),
                correct_index=item["correct"],
                explanation=item.get("explanation", ""),
            )
        )

    db.session.commit()
    return jsonify(quiz.to_dict(include_questions=True)), 201


@quizzes_bp.route("/recommended", methods=["GET"])
@jwt_required()
def recommended_quizzes():
    """
    Get personalized quiz recommendations
    ---
    tags:
      - Quizzes
    security:
      - Bearer: []
    parameters:
      - name: limit
        in: query
        type: integer
        required: false
      - name: student_id
        in: query
        type: integer
        required: false
        description: Admin-only override to get recommendations for a specific student.
    responses:
      200:
        description: Recommended quizzes
      403:
        description: Forbidden
    """
    requester_id = int(get_jwt_identity())
    requester = User.query.get(requester_id)
    if not requester:
        return jsonify({"error": "Unauthorized"}), 401

    target_user = requester
    student_override = request.args.get('student_id')
    if student_override:
        if requester.role != 'admin':
            return jsonify({"error": "Admin only"}), 403
        try:
            target_id = int(student_override)
        except (TypeError, ValueError):
            return jsonify({"error": "student_id must be an integer"}), 400
        target_user = User.query.get(target_id)
        if not target_user or target_user.role != 'student':
            return jsonify({"error": "student not found"}), 404

    try:
        limit = int(request.args.get('limit', 6))
    except (TypeError, ValueError):
        limit = 6
    limit = max(1, min(limit, 20))

    preferred_categories = _preferred_categories_from_weak_areas(target_user.weak_areas.split(',') if target_user.weak_areas else [])
    attempted_ids = {
        row.quiz_id
        for row in QuizAttempt.query.filter_by(student_id=target_user.id).all()
    }

    recommended = []
    seen = set()
    for category in preferred_categories:
        query = Quiz.query.filter_by(category=category).order_by(Quiz.id.desc()).all()
        for quiz in query:
            if quiz.id in seen or quiz.id in attempted_ids:
                continue
            recommended.append({
                **quiz.to_dict(),
                'reason': f"Recommended for weak area focus: {category}",
            })
            seen.add(quiz.id)
            if len(recommended) >= limit:
                return jsonify(recommended)

    # Fill remainder with latest unseen quizzes across all categories.
    if len(recommended) < limit:
        for quiz in Quiz.query.order_by(Quiz.id.desc()).all():
            if quiz.id in seen or quiz.id in attempted_ids:
                continue
            recommended.append({
                **quiz.to_dict(),
                'reason': 'New practice recommended to keep momentum.',
            })
            seen.add(quiz.id)
            if len(recommended) >= limit:
                break

    return jsonify(recommended)


@quizzes_bp.route("/<int:quiz_id>", methods=["GET"])
@jwt_required()
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify(quiz.to_dict(include_questions=True))


@quizzes_bp.route("/<int:quiz_id>/attempt", methods=["POST"])
@jwt_required()
def submit_attempt(quiz_id):
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
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
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    r = Resource.query.get_or_404(resource_id)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Deleted"})