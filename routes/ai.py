from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from utils.ai_helpers import speech_to_text, check_grammar

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@ai_bp.route('/writing/analyze', methods=['POST'])
@jwt_required()
def analyze_writing():
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({'error': 'text is required'}), 400

    result = check_grammar(text)
    words = max(len(text.split()), 1)
    band = min(9.0, round(4.5 + (result['grammar_score'] / 18) + (result['vocabulary_richness'] * 0.8), 1))

    return jsonify({
        'transcript': text,
        'analysis': result,
        'band_estimate': band,
        'source': 'helper',
    })


@ai_bp.route('/writing/rewrite', methods=['POST'])
@jwt_required()
def rewrite_writing():
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({'error': 'text is required'}), 400

    # Lightweight rewrite heuristic for premium-feel instant feedback.
    replacements = {
        'very': 'highly',
        'good': 'beneficial',
        'bad': 'detrimental',
        'a lot': 'considerably',
        'kids': 'children',
        'big': 'significant',
        'small': 'marginal',
        'many': 'numerous',
        'thing': 'aspect',
    }
    rewritten = text
    for plain, advanced in replacements.items():
        rewritten = rewritten.replace(f' {plain} ', f' {advanced} ')

    if rewritten == text:
        rewritten = f"In contemporary contexts, {text[0].lower() + text[1:] if len(text) > 1 else text}"

    upgrade_notes = [
        'Used more formal lexical choices for IELTS Task 2 tone.',
        'Improved cohesion by introducing a clearer argumentative register.',
        'Prioritized concise but higher-band phrasing patterns.',
    ]

    return jsonify({
        'original': text,
        'rewritten': rewritten,
        'target_band': 9.0,
        'upgrade_notes': upgrade_notes,
        'source': 'rule-based-rewriter',
    })


@ai_bp.route('/speaking/analyze', methods=['POST'])
@jwt_required()
def analyze_speaking():
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    transcript = (data.get('transcript') or '').strip()
    audio_url = (data.get('audio_url') or '').strip()

    if not transcript and not audio_url:
        return jsonify({'error': 'transcript or audio_url is required'}), 400

    if not transcript and audio_url:
        transcript_result = speech_to_text(audio_url)
        transcript = transcript_result.get('transcript', '')
    else:
        transcript_result = {'mock': True, 'confidence': 0.0}

    words = transcript.split()
    filler_words = ['uh', 'um', 'like', 'you know', 'basically', 'actually']
    filler_count = sum(transcript.lower().count(filler) for filler in filler_words)

    grammar = check_grammar(transcript)
    fluency_score = max(30, min(100, 92 - filler_count * 4 - max(len(words) - 160, 0) * 0.2))
    pronunciation_score = max(35, min(100, 75 + (10 if transcript_result.get('mock') else 0) - filler_count * 2))
    grammar_score = grammar['grammar_score']
    band = round((fluency_score + pronunciation_score + grammar_score) / 30, 1)

    return jsonify({
        'transcript': transcript,
        'analysis': {
            'fluency_score': round(fluency_score, 1),
            'pronunciation_score': round(pronunciation_score, 1),
            'grammar_score': grammar_score,
            'filler_count': filler_count,
            'suggestions': grammar['suggestions'],
        },
        'band_estimate': min(9.0, band),
        'source': 'helper' if transcript_result.get('mock') else 'placeholder',
    })


@ai_bp.route('/quiz/analyze', methods=['POST'])
@jwt_required()
def analyze_quiz():
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    score = float(data.get('score') or 0)
    total = max(int(data.get('total') or 0), 1)
    quiz_title = (data.get('quiz_title') or 'IELTS Quiz').strip()
    category = (data.get('category') or 'general').strip()
    correct = max(int(data.get('correct') or 0), 0)
    weak_points = data.get('weak_points') or []

    ratio = max(0.0, min(1.0, score / 100.0))
    band = round(4.5 + (ratio * 4.0), 1)
    strengths = []
    suggestions = []

    if score >= 80:
        strengths.append('Strong accuracy across most question types')
        suggestions.append('Push time pressure with harder timed mock sets.')
    elif score >= 60:
        strengths.append('Solid understanding of the core IELTS pattern')
        suggestions.append('Focus on eliminating avoidable mistakes in repeated topics.')
    else:
        strengths.append('You are building the base for the topic')
        suggestions.append('Slow down and review the explanation after every question.')

    if weak_points:
        suggestions.extend([f'Revisit {point} with 10-minute drills.' for point in weak_points[:3]])
    else:
        suggestions.append(f'Practice more {category} questions from {quiz_title}.')

    suggestions.append('Retake this quiz after one focused revision session.')

    return jsonify({
        'quiz_title': quiz_title,
        'category': category,
        'analysis': {
            'strengths': strengths,
            'suggestions': suggestions,
            'accuracy': round(ratio * 100, 1),
            'correct': correct,
            'total': total,
        },
        'band_estimate': min(9.0, band),
        'source': 'rule-based-coach',
    })


@ai_bp.route('/debate/analyze', methods=['POST'])
@jwt_required()
def analyze_debate():
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    argument = (data.get('argument') or '').strip()
    topic = (data.get('topic') or 'general topic').strip()
    if not argument:
        return jsonify({'error': 'argument is required'}), 400

    words = [w for w in argument.split() if w]
    token_count = len(words)
    connector_pool = ['however', 'therefore', 'moreover', 'although', 'because', 'while', 'whereas', 'consequently']
    connector_count = sum(argument.lower().count(connector) for connector in connector_pool)
    lexical_variety = len(set(w.lower().strip('.,!?') for w in words)) / max(token_count, 1)

    structure_score = min(100, 45 + connector_count * 12 + min(token_count, 140) * 0.2)
    vocabulary_score = min(100, 40 + lexical_variety * 65)
    argument_score = min(100, round((structure_score * 0.55) + (vocabulary_score * 0.45), 1))
    band_estimate = min(9.0, round(4.5 + (argument_score / 100) * 4.0, 1))

    tips = [
        'State your main claim in the opening sentence before evidence.',
        'Use one counterargument and rebuttal to strengthen logic.',
        'Conclude by restating impact, not only the opinion.',
    ]
    if connector_count < 2:
        tips.insert(0, 'Use linking devices like however, therefore, and consequently for coherence.')
    if token_count < 60:
        tips.insert(0, 'Expand your argument with one concrete example to improve depth.')

    return jsonify({
        'topic': topic,
        'analysis': {
            'argument_strength': round(argument_score, 1),
            'structure_score': round(structure_score, 1),
            'vocabulary_score': round(vocabulary_score, 1),
            'word_count': token_count,
            'connector_count': connector_count,
            'tips': tips,
        },
        'band_estimate': band_estimate,
        'source': 'rule-based-debate',
    })