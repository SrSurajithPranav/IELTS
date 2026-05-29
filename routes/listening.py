import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User

listening_bp = Blueprint('listening', __name__, url_prefix='/api/listening')


@listening_bp.route('/dictation/generate', methods=['GET'])
@jwt_required()
def generate_dictation():
    """Generate a random dictation exercise for numbers, dates, postcodes, etc."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    types = ['phone', 'date', 'postcode', 'credit_card', 'time', 'percentage']
    dictation_type = random.choice(types)
    
    if dictation_type == 'phone':
        correct = f"{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"
        text = f"Phone number: {correct}"
    elif dictation_type == 'date':
        day = random.randint(1, 28)
        month = random.randint(1, 12)
        year = random.randint(1980, 2023)
        correct = f"{day:02d}/{month:02d}/{year}"
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        text = f"Date: {day:02d} {months[month-1]} {year}"
    elif dictation_type == 'postcode':
        correct = f"{chr(random.randint(65,90))}{random.randint(1,99)} {random.randint(1,99)}{chr(random.randint(65,90))}{chr(random.randint(65,90))}"
        text = f"Postcode: {correct}"
    elif dictation_type == 'credit_card':
        correct = f"{random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)}"
        text = f"Credit card number: {correct}"
    elif dictation_type == 'time':
        hour = random.randint(1, 12)
        minute = random.randint(0, 59)
        correct = f"{hour:02d}:{minute:02d}"
        ampm = 'am' if random.random() > 0.5 else 'pm'
        text = f"The time is {hour} {minute:02d} {ampm}"
    else:  # percentage
        correct = f"{random.randint(1,100)}%"
        text = f"Percentage: {correct}"
    
    return jsonify({
        'type': dictation_type,
        'audio_text': text,
        'correct_answer': correct
    })


@listening_bp.route('/dictation/check', methods=['POST'])
@jwt_required()
def check_dictation():
    """Check if the dictation answer is correct."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    user_answer = (data.get('answer') or '').strip()
    correct_answer = (data.get('correct') or '').strip()
    
    if not correct_answer:
        return jsonify({'error': 'correct answer is required'}), 400
    
    # Normalize for comparison
    user_norm = user_answer.replace(' ', '').lower()
    correct_norm = correct_answer.replace(' ', '').lower()
    
    is_correct = user_norm == correct_norm
    return jsonify({
        'correct': is_correct,
        'feedback': 'Correct!' if is_correct else f'Expected: {correct_answer}'
    })


@listening_bp.route('/spelling-check', methods=['POST'])
@jwt_required()
def check_spelling():
    """Check spelling with emphasis on common IELTS misspellings."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    user_answer = (data.get('answer') or '').strip()
    correct_answer = (data.get('correct') or '').strip()
    
    if not correct_answer:
        return jsonify({'error': 'correct answer is required'}), 400
    
    common_mistakes = {
        'accommodation': 'accomodation, acommodation',
        'government': 'goverment, govermment',
        'environment': 'enviroment, enviornment',
        'necessary': 'neccessary, necesary',
        'February': 'Febuary, Februry',
        'separate': 'seperate',
        'definitely': 'definately, defenitely',
        'occurred': 'ocured, occured'
    }
    
    is_correct = user_answer.lower() == correct_answer.lower()
    
    feedback = []
    if not is_correct:
        if correct_answer.lower() in common_mistakes:
            feedback.append(f"Common error: '{correct_answer}' is often misspelled as '{common_mistakes[correct_answer.lower()]}'")
        feedback.append(f"Expected: '{correct_answer}'")
    
    return jsonify({
        'correct': is_correct,
        'feedback': feedback,
        'penalty_applied': not is_correct
    })


@listening_bp.route('/ng-false-drill', methods=['GET'])
@jwt_required()
def get_ng_false_drill():
    """Get a drill item for practicing 'Not Given' vs 'False' distinction."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    drills = [
        {
            'statement': 'The study included participants from five countries.',
            'passage': 'Researchers surveyed 1,000 individuals from the United States, Canada, and Mexico.',
            'answer': 'False',
            'explanation': 'The passage mentions only 3 countries, not 5.'
        },
        {
            'statement': 'All participants completed the full 12-week program.',
            'passage': 'Of the 200 initial volunteers, 150 finished the entire 12-week study.',
            'answer': 'False',
            'explanation': 'Not all participants finished – 50 dropped out.'
        },
        {
            'statement': 'The experiment was conducted during winter months.',
            'passage': 'Data collection took place over a six-month period beginning in March.',
            'answer': 'Not Given',
            'explanation': 'March is spring, but we don\'t know if winter months were included.'
        },
        {
            'statement': 'The cost of the program was over $5,000.',
            'passage': 'The program included training, materials, and six months of support.',
            'answer': 'Not Given',
            'explanation': 'The passage does not mention the cost.'
        },
        {
            'statement': 'Solar panels are the most efficient renewable energy source.',
            'passage': 'Both solar and wind energy have advantages and disadvantages.',
            'answer': 'False',
            'explanation': 'The passage says both have advantages/disadvantages, not that one is most efficient.'
        }
    ]
    return jsonify(random.choice(drills))


@listening_bp.route('/sections', methods=['GET'])
@jwt_required()
def get_listening_sections():
    """Get metadata about listening test sections."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    sections = [
        {
            'section': 1,
            'title': 'Social Conversation',
            'difficulty': 'Easy',
            'speakers': 2,
            'duration': '10 min',
            'description': 'A friendly conversation between two people about everyday topics'
        },
        {
            'section': 2,
            'title': 'Monologue (General)',
            'difficulty': 'Medium',
            'speakers': 1,
            'duration': '10 min',
            'description': 'A person talks about a general topic like a tour or event'
        },
        {
            'section': 3,
            'title': 'Academic Discussion',
            'difficulty': 'Hard',
            'speakers': '2-4',
            'duration': '10 min',
            'description': 'A discussion between students and a teacher about an academic topic'
        },
        {
            'section': 4,
            'title': 'Academic Lecture',
            'difficulty': 'Expert',
            'speakers': 1,
            'duration': '10 min',
            'description': 'A professor gives a lecture on an academic subject'
        }
    ]
    return jsonify({'sections': sections})
