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
