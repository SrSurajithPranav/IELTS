from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.speaking_topic import SpeakingTopic

speaking_bp = Blueprint('speaking', __name__, url_prefix='/api/speaking')


@speaking_bp.route('/random', methods=['GET'])
@jwt_required()
def random_topic():
    import random
    part = request.args.get('part')
    q = SpeakingTopic.query
    if part:
        try:
            p = int(part)
            q = q.filter_by(part=p)
        except:
            pass
    all_topics = q.all()
    if not all_topics:
        return jsonify({'error': 'No topics found'}), 404
    t = random.choice(all_topics)
    return jsonify(t.to_dict())


@speaking_bp.route('/', methods=['POST'])
@jwt_required()
def create_topic():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    topic = SpeakingTopic(part=int(data.get('part', 2)), question=data.get('question', ''), created_by=uid)
    db.session.add(topic)
    db.session.commit()
    return jsonify(topic.to_dict()), 201
