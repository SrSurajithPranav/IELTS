from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.vocabulary import Vocabulary

vocabulary_bp = Blueprint('vocabulary', __name__, url_prefix='/api/vocabulary')


@vocabulary_bp.route('/', methods=['GET'])
@jwt_required()
def list_words():
    uid = int(get_jwt_identity())
    words = Vocabulary.query.filter_by(user_id=uid).order_by(Vocabulary.created_at.desc()).all()
    return jsonify([w.to_dict() for w in words])


@vocabulary_bp.route('/', methods=['POST'])
@jwt_required()
def create_word():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    word = Vocabulary(
        user_id=uid,
        word=data.get('word', '').strip(),
        definition=data.get('definition', '').strip(),
        example=data.get('example', '').strip(),
    )
    db.session.add(word)
    db.session.commit()
    return jsonify(word.to_dict()), 201


@vocabulary_bp.route('/<int:wid>', methods=['PATCH'])
@jwt_required()
def patch_word(wid):
    uid = int(get_jwt_identity())
    word = Vocabulary.query.get(wid)
    if not word or word.user_id != uid:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    if 'mastered' in data:
        word.mastered = bool(data['mastered'])
    if 'definition' in data:
        word.definition = data['definition']
    if 'example' in data:
        word.example = data['example']
    db.session.commit()
    return jsonify(word.to_dict())


@vocabulary_bp.route('/review-due', methods=['GET'])
@jwt_required()
def review_due():
    uid = int(get_jwt_identity())
    # Simple spaced repetition heuristic: due if never reviewed or last review > (2 ** review_count) days
    from datetime import datetime, timedelta
    rows = Vocabulary.query.filter_by(user_id=uid).all()
    due = []
    now = datetime.utcnow()
    for w in rows:
        if w.mastered:
            continue
        if not w.last_reviewed_at:
            due.append(w)
            continue
        interval_days = 2 ** max(0, (w.review_count or 0))
        if w.last_reviewed_at + timedelta(days=interval_days) <= now:
            due.append(w)
    return jsonify([w.to_dict() for w in due])


@vocabulary_bp.route('/<int:wid>/review', methods=['POST'])
@jwt_required()
def mark_reviewed(wid):
    uid = int(get_jwt_identity())
    word = Vocabulary.query.get(wid)
    if not word or word.user_id != uid:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    correct = bool(data.get('correct', True))
    from datetime import datetime
    if correct:
        word.review_count = (word.review_count or 0) + 1
    else:
        word.review_count = max(0, (word.review_count or 0) - 1)
    word.last_reviewed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(word.to_dict())
