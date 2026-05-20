from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.submission import Submission
from models.task import Task
from utils.ai_helpers import speech_to_text, check_grammar
from collections import Counter
from datetime import datetime, timedelta

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


SKILLS = ['reading', 'listening', 'writing', 'speaking', 'grammar']


def _resolve_target_student(requester, student_id):
    if student_id is None:
        return requester, None
    if requester.role != 'admin':
        return None, (jsonify({'error': 'Admin only'}), 403)
    try:
        sid = int(student_id)
    except (TypeError, ValueError):
        return None, (jsonify({'error': 'student_id must be an integer'}), 400)
    target = User.query.get(sid)
    if not target or target.role != 'student':
        return None, (jsonify({'error': 'student not found'}), 404)
    return target, None


def _skill_snapshot(student_id, days=21):
    since = datetime.utcnow() - timedelta(days=days)
    rows = Submission.query.filter(
        Submission.student_id == student_id,
        Submission.submitted_at >= since,
    ).all()

    by_skill = {skill: {'submitted': 0, 'reviewed': 0} for skill in SKILLS}
    for row in rows:
        skill = (row.task.type if row.task else '').lower().strip()
        if skill not in by_skill:
            continue
        by_skill[skill]['submitted'] += 1
        if (row.status or '').lower() == 'reviewed':
            by_skill[skill]['reviewed'] += 1
    return by_skill, rows


def _priority_skills(user, by_skill):
    weak = [w.strip().lower() for w in (user.weak_areas or '').split(',') if w.strip()]
    score_map = Counter()
    for skill in SKILLS:
        submitted = by_skill[skill]['submitted']
        reviewed = by_skill[skill]['reviewed']
        review_ratio = reviewed / submitted if submitted else 0
        score_map[skill] += (1 - review_ratio) * 2
        if submitted == 0:
            score_map[skill] += 1.8
        if any(skill[:4] in area or area[:4] in skill for area in weak):
            score_map[skill] += 2.5

    ranked = [skill for skill, _ in score_map.most_common()]
    return ranked[:3] if ranked else ['writing', 'speaking', 'reading']


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


@ai_bp.route('/study-plan', methods=['GET'])
@jwt_required()
def study_plan():
        """
        Generate a personalized 7-day AI study plan
        ---
        tags:
            - AI
        security:
            - Bearer: []
        parameters:
            - name: student_id
                in: query
                type: integer
                required: false
                description: Admin-only override for specific student.
        responses:
            200:
                description: Personalized study plan
            403:
                description: Forbidden
        """
        uid = int(get_jwt_identity())
        requester = User.query.get(uid)
        if not requester:
                return jsonify({'error': 'Unauthorized'}), 401

        target, err = _resolve_target_student(requester, request.args.get('student_id'))
        if err:
                return err

        by_skill, recent_subs = _skill_snapshot(target.id)
        priorities = _priority_skills(target, by_skill)
        total_recent = len(recent_subs)
        reviewed_recent = sum(1 for row in recent_subs if (row.status or '').lower() == 'reviewed')
        review_rate = round((reviewed_recent / total_recent) * 100, 1) if total_recent else 0.0

        weekly_plan = []
        for day in range(1, 8):
                focus = priorities[(day - 1) % len(priorities)]
                weekly_plan.append({
                        'day': day,
                        'focus_skill': focus,
                        'duration_min': 45 if day % 3 else 60,
                        'mission': f'Practice {focus} with one timed drill and one reflection pass.',
                        'tasks': [
                                f'Warm-up: 10 minutes of focused {focus} review.',
                                f'Main set: one IELTS-style {focus} task under time pressure.',
                                'Reflection: capture 3 mistakes and 1 improvement target.',
                        ],
                })

        return jsonify({
                'student': {
                        'id': target.id,
                        'name': target.name,
                        'estimated_band': target.score,
                        'streak': target.streak,
                },
                'insights': {
                        'recent_submissions': total_recent,
                        'review_rate_percent': review_rate,
                        'weak_areas': [w.strip() for w in (target.weak_areas or '').split(',') if w.strip()],
                },
                'priority_skills': priorities,
                'weekly_plan': weekly_plan,
                'coach_message': 'Consistency beats intensity. Complete at least 5 of 7 days for measurable score gains.',
                'source': 'rule-based-study-planner',
        })


@ai_bp.route('/drill/next', methods=['POST'])
@jwt_required()
def next_drill():
        """
        Generate the next best AI drill for the student
        ---
        tags:
            - AI
        security:
            - Bearer: []
        parameters:
            - name: body
                in: body
                required: false
                schema:
                    properties:
                        preferred_skill:
                            type: string
                        minutes:
                            type: integer
                        student_id:
                            type: integer
        responses:
            200:
                description: Next drill recommendation
            403:
                description: Forbidden
        """
        uid = int(get_jwt_identity())
        requester = User.query.get(uid)
        if not requester:
                return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json(silent=True) or {}
        target, err = _resolve_target_student(requester, data.get('student_id'))
        if err:
                return err

        by_skill, _ = _skill_snapshot(target.id, days=14)
        priorities = _priority_skills(target, by_skill)
        preferred = (data.get('preferred_skill') or '').strip().lower()
        focus = preferred if preferred in SKILLS else priorities[0]

        try:
                minutes = int(data.get('minutes', 20))
        except (TypeError, ValueError):
                minutes = 20
        minutes = max(10, min(minutes, 60))

        drill_bank = {
                'reading': {
                        'title': 'Precision Skim + T/F/NG Sprint',
                        'prompt': 'Read one medium passage and answer 8 True/False/Not Given items in one sitting.',
                        'success_criteria': 'At least 6/8 correct with < 2 inference mistakes.',
                },
                'listening': {
                        'title': 'Number & Detail Capture Drill',
                        'prompt': 'Listen to one section and capture names, dates, times, and numbers on first pass.',
                        'success_criteria': 'At least 80% detail accuracy in your notes.',
                },
                'writing': {
                        'title': 'Thesis + Topic Sentence Builder',
                        'prompt': 'Write intro + two body topic sentences for one Task 2 prompt before full essay.',
                        'success_criteria': 'Clear position and logical paragraph progression.',
                },
                'speaking': {
                        'title': '2-Minute Fluency Loop',
                        'prompt': 'Record one 2-minute response, review filler words, then re-record improved version.',
                        'success_criteria': 'Second attempt has fewer fillers and tighter structure.',
                },
                'grammar': {
                        'title': 'Accuracy Repair Set',
                        'prompt': 'Fix 10 sentence-level grammar errors and rewrite each sentence in one variation.',
                        'success_criteria': '9/10 corrected accurately with clear rule awareness.',
                },
        }

        selected = drill_bank[focus]
        return jsonify({
                'student_id': target.id,
                'focus_skill': focus,
                'duration_min': minutes,
                'drill': {
                        'title': selected['title'],
                        'prompt': selected['prompt'],
                        'checklist': [
                                'Set a timer and complete in one uninterrupted session.',
                                'Mark mistakes immediately after finishing.',
                                'Write one improvement rule before next attempt.',
                        ],
                        'success_criteria': selected['success_criteria'],
                },
                'next_step': f'After this drill, take a short {focus} quiz and compare accuracy.',
                'source': 'rule-based-drill-recommender',
        })