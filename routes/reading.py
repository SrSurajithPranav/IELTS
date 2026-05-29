import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User

reading_bp = Blueprint('reading', __name__, url_prefix='/api/reading')


@reading_bp.route('/drill/<drill_type>', methods=['GET'])
@jwt_required()
def get_reading_drill(drill_type):
    """Get a reading drill for a specific question type."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    drills = {
        'true_false_ng': {
            'passage': 'The Earth\'s climate has changed throughout history. While some changes are natural, human activities have accelerated warming. Scientists agree that greenhouse gas emissions are a primary cause. The debate is not about whether climate is changing, but about the pace and causes.',
            'questions': [
                {'statement': 'Climate change has only occurred in recent centuries.', 'answer': 'False'},
                {'statement': 'Natural factors contribute to climate variations.', 'answer': 'True'},
                {'statement': 'Volcanic eruptions are the main cause of current warming.', 'answer': 'Not Given'},
                {'statement': 'All scientists disagree about climate causes.', 'answer': 'False'}
            ]
        },
        'matching_headings': {
            'passage': 'A. Renewable energy sources include solar, wind, and hydroelectric power. B. These sources are sustainable but can be intermittent, requiring backup systems. C. Energy storage technology is improving rapidly to address intermittency challenges. D. Governments are investing heavily in renewable infrastructure.',
            'questions': [
                {'text': 'Paragraph A', 'heading': 'Definition of renewable energy', 'answer': 'A'},
                {'text': 'Paragraph B', 'heading': 'Advantages and disadvantages of renewables', 'answer': 'B'},
                {'text': 'Paragraph C', 'heading': 'The future of energy storage', 'answer': 'C'}
            ]
        },
        'multiple_choice': {
            'passage': 'The Industrial Revolution began in Britain around 1760. It marked a shift from agrarian societies to industrial and urban ones. New technologies like the steam engine transformed manufacturing and transportation, leading to rapid economic growth and social change.',
            'questions': [
                {
                    'text': 'When did the Industrial Revolution begin?',
                    'options': ['1650', '1760', '1860', '1950'],
                    'answer': '1760'
                },
                {
                    'text': 'What was a major outcome of the Industrial Revolution?',
                    'options': ['Decrease in population', 'Shift from agrarian to industrial society', 'Return to farming', 'Isolation of nations'],
                    'answer': 'Shift from agrarian to industrial society'
                }
            ]
        },
        'short_answer': {
            'passage': 'Photosynthesis is the process by which plants convert sunlight into chemical energy. The process occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions and the Calvin cycle.',
            'questions': [
                {'question': 'Where does photosynthesis occur in plant cells?', 'answer': 'chloroplasts'},
                {'question': 'How many main stages does photosynthesis have?', 'answer': 'two'}
            ]
        }
    }
    
    if drill_type not in drills:
        return jsonify({'error': 'Invalid drill type'}), 400
    
    return jsonify(drills[drill_type])


@reading_bp.route('/ng-false-check', methods=['POST'])
@jwt_required()
def check_ng_false():
    """Check if answer correctly distinguishes between False and Not Given."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    user_answer = (data.get('answer') or '').strip().lower()
    correct_answer = (data.get('correct') or '').strip().lower()
    
    if not correct_answer:
        return jsonify({'error': 'correct answer is required'}), 400
    
    is_correct = user_answer == correct_answer
    
    # Provide educational feedback
    feedback = {
        'correct': is_correct,
        'explanation': ''
    }
    
    if not is_correct:
        if user_answer == 'false' and correct_answer == 'not given':
            feedback['explanation'] = 'This is NOT GIVEN because the passage doesn\'t mention it at all. FALSE would mean the passage explicitly contradicts the statement.'
        elif user_answer == 'not given' and correct_answer == 'false':
            feedback['explanation'] = 'This is FALSE because the passage explicitly contradicts the statement. NOT GIVEN would mean the passage simply doesn\'t mention it.'
    else:
        feedback['explanation'] = 'Correct! You properly identified the distinction.'
    
    return jsonify(feedback)


@reading_bp.route('/keywords/extract', methods=['POST'])
@jwt_required()
def extract_keywords():
    """Extract and locate keywords in a passage."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    passage = (data.get('passage') or '').strip()
    question = (data.get('question') or '').strip()
    keywords = data.get('keywords') or []
    
    if not passage or not keywords:
        return jsonify({'error': 'passage and keywords are required'}), 400
    
    # Find locations of keywords in passage
    locations = {}
    passage_lower = passage.lower()
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        idx = passage_lower.find(keyword_lower)
        if idx != -1:
            locations[keyword] = {
                'found': True,
                'position': idx,
                'context': passage[max(0, idx-50):min(len(passage), idx+len(keyword)+50)]
            }
        else:
            locations[keyword] = {'found': False}
    
    # Highlight text
    highlighted = passage
    for keyword in keywords:
        if keyword.lower() in passage.lower():
            import re
            highlighted = re.sub(
                f'({re.escape(keyword)})',
                r'<mark>\1</mark>',
                highlighted,
                flags=re.IGNORECASE
            )
    
    return jsonify({
        'question': question,
        'keywords_found': sum(1 for loc in locations.values() if loc.get('found')),
        'keywords_total': len(keywords),
        'locations': locations,
        'highlighted_passage': highlighted
    })


@reading_bp.route('/awl-highlight', methods=['POST'])
@jwt_required()
def highlight_academic_words():
    """Highlight Academic Word List (AWL) words in a passage."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    passage = (data.get('passage') or '').strip()
    
    if not passage:
        return jsonify({'error': 'passage is required'}), 400
    
    # Academic Word List - Band 1 (most frequent)
    awl_words = {
        'analyze': 'to examine something in detail',
        'approach': 'a way of dealing with something',
        'area': 'a particular subject or activity',
        'assess': 'to evaluate or estimate the value of',
        'assume': 'to suppose without proof',
        'available': 'able to be used or obtained',
        'benefit': 'an advantage or profit gained',
        'concept': 'an abstract idea',
        'consistent': 'acting or done in the same way over time',
        'context': 'the circumstances that form a setting',
        'contract': 'a written or spoken agreement',
        'create': 'to bring something into existence',
        'data': 'facts and statistics collected together',
        'define': 'to state exactly what something means',
        'derive': 'to obtain something from a source',
        'distribute': 'to give out or spread over an area',
        'economy': 'the wealth and resources of a country',
        'environment': 'the surroundings or conditions',
        'establish': 'to set up or create',
        'estimate': 'to roughly calculate the value'
    }
    
    # Highlight AWL words
    highlighted = passage
    import re
    
    words_found = []
    for word in awl_words.keys():
        if re.search(r'\b' + word + r'\b', highlighted, re.IGNORECASE):
            words_found.append(word)
            highlighted = re.sub(
                r'\b(' + word + r')\b',
                r'<mark class="awl-word" title="' + awl_words[word] + r'">\1</mark>',
                highlighted,
                flags=re.IGNORECASE
            )
    
    return jsonify({
        'total_awl_words': len(words_found),
        'awl_words_found': words_found,
        'definitions': {word: awl_words[word] for word in words_found},
        'highlighted_passage': highlighted
    })


@reading_bp.route('/time-target', methods=['POST'])
@jwt_required()
def calculate_reading_time_target():
    """Calculate recommended time per passage based on word count."""
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    word_count = int(data.get('word_count') or 0)
    num_questions = int(data.get('num_questions') or 0)
    
    if word_count <= 0:
        return jsonify({'error': 'word_count must be positive'}), 400
    
    # IELTS reading: 3 passages, 40 questions in 60 minutes
    # Typical: 750-900 words per passage, 13-14 questions per passage
    # Recommended pace: ~1 min per 50 words + 1 min per question
    
    reading_time = max(3, round(word_count / 50))
    question_time = max(3, round(num_questions * 1.2))
    total_time = reading_time + question_time
    
    return jsonify({
        'word_count': word_count,
        'num_questions': num_questions,
        'reading_time_minutes': reading_time,
        'question_time_minutes': question_time,
        'total_recommended_minutes': total_time,
        'advice': 'This is an estimate. Practice to find your optimal pace.'
    })
