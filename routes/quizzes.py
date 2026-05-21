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
from utils.ai_helpers import paraphrase_text
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
    "grammar": [
        {
            "question": "Which sentence uses the passive voice correctly?",
            "options": [
                "The report was written by the team.",
                "The team wrote the report by was.",
                "The report were written by the team.",
                "By the team the report was writing.",
            ],
            "correct": 0,
            "explanation": "Passive voice: subject + 'to be' + past participle. 'The report was written' is correct.",
        },
        {
            "question": "Choose the correct article: '___ IELTS exam tests four skills.'",
            "options": ["A", "An", "The", "No article"],
            "correct": 2,
            "explanation": "'The' is used for specific, known nouns. The IELTS exam is a specific, well-known test.",
        },
        {
            "question": "Which sentence is grammatically correct?",
            "options": [
                "Despite of the rain, they continued.",
                "Despite the rain, they continued.",
                "Despite of rain, they continued.",
                "Despite that rain, they continued.",
            ],
            "correct": 1,
            "explanation": "'Despite' is a preposition followed directly by a noun phrase, not 'of'.",
        },
        {
            "question": "Select the correct conditional: 'If I ___ harder, I would have passed.'",
            "options": ["study", "studied", "had studied", "have studied"],
            "correct": 2,
            "explanation": "Third conditional (past unreal): 'if + past perfect, would + have + past participle'.",
        },
        {
            "question": "Which linking word correctly shows contrast?",
            "options": ["Furthermore", "Therefore", "Nevertheless", "Consequently"],
            "correct": 2,
            "explanation": "'Nevertheless' introduces a contrasting point despite a previous statement.",
        },
        {
            "question": "Identify the error: 'The informations provided were useful.'",
            "options": [
                "'informations' — should be 'information' (uncountable)",
                "'were' — should be 'was'",
                "'provided' — should be 'providing'",
                "No error",
            ],
            "correct": 0,
            "explanation": "'Information' is an uncountable noun in English and has no plural form.",
        },
        {
            "question": "Which sentence uses a relative clause correctly?",
            "options": [
                "The student which passed the test was happy.",
                "The student who passed the test was happy.",
                "The student that he passed the test was happy.",
                "The student, he passed the test, was happy.",
            ],
            "correct": 1,
            "explanation": "Use 'who' for people in relative clauses, not 'which'.",
        },
        {
            "question": "Choose the correct form: 'She suggested ___ the library.'",
            "options": ["to visit", "visiting", "visit", "visited"],
            "correct": 1,
            "explanation": "'Suggest' is followed by a gerund (-ing), not an infinitive.",
        },
        {
            "question": "Which sentence has correct subject-verb agreement?",
            "options": [
                "The number of students are increasing.",
                "A number of students is attending.",
                "The number of students is increasing.",
                "A number of student are attending.",
            ],
            "correct": 2,
            "explanation": "'The number' is singular; 'a number' is plural. 'The number of students is' is correct.",
        },
        {
            "question": "Pick the correct comparative: 'This essay is ___ the previous one.'",
            "options": [
                "more better than",
                "better than",
                "more good than",
                "gooder than",
            ],
            "correct": 1,
            "explanation": "'Better' is already a comparative. Never use 'more better'.",
        },
    ],
    "vocab": [
        {
            "question": "What does 'ubiquitous' mean?",
            "options": [
                "Appearing everywhere / very common",
                "Extremely rare",
                "Highly dangerous",
                "Difficult to understand",
            ],
            "correct": 0,
            "explanation": "'Ubiquitous' means present, appearing, or found everywhere.",
        },
        {
            "question": "Choose the correct collocations: 'make or do?' — '___ a mistake'",
            "options": ["Do", "Make", "Have", "Take"],
            "correct": 1,
            "explanation": "'Make a mistake' is a fixed collocation in English.",
        },
        {
            "question": "Which word best replaces 'important' in an IELTS essay for a higher band?",
            "options": ["Big", "Crucial", "Main", "Good"],
            "correct": 1,
            "explanation": "'Crucial' is a precise, formal synonym that lifts your Lexical Resource score.",
        },
        {
            "question": "What does 'mitigate' mean in academic writing?",
            "options": [
                "To make something worse",
                "To measure something",
                "To make something less severe",
                "To ignore a problem",
            ],
            "correct": 2,
            "explanation": "'Mitigate' means to lessen the severity or impact of something.",
        },
        {
            "question": "Which word is a synonym for 'significant'?",
            "options": ["Minor", "Considerable", "Slight", "Trivial"],
            "correct": 1,
            "explanation": "'Considerable' carries a similar meaning to 'significant' and is useful in formal writing.",
        },
        {
            "question": "Select the word that means 'to make something worse':",
            "options": ["Alleviate", "Exacerbate", "Mitigate", "Ameliorate"],
            "correct": 1,
            "explanation": "'Exacerbate' means to make a problem or situation worse.",
        },
        {
            "question": "What is the noun form of 'analyse'?",
            "options": ["Analysing", "Analysed", "Analysis", "Analyst"],
            "correct": 2,
            "explanation": "The noun form is 'analysis'. 'Analyst' is a person who analyses.",
        },
        {
            "question": "Choose the academic paraphrase of 'people think': ",
            "options": [
                "Scholars argue",
                "Guys believe",
                "Folks reckon",
                "Persons say",
            ],
            "correct": 0,
            "explanation": "'Scholars argue / researchers suggest / critics contend' are all strong academic alternatives.",
        },
    ],
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
            "explanation": "The passage links improved infrastructure with higher usage — a causal inference.",
        },
        {
            "question": "In IELTS Reading, which strategy best helps with True/False/Not Given questions?",
            "options": [
                "Match meaning precisely, not just matching words",
                "Read only the questions, not the passage",
                "Always choose 'Not Given' when unsure",
                "Skip paragraphs with unfamiliar vocabulary",
            ],
            "correct": 0,
            "explanation": "Paraphrase detection is essential — wrong keywords can mislead you into wrong answers.",
        },
        {
            "question": "A heading in a reading passage says 'The Decline of Coral Reefs'. What type of text structure is this?",
            "options": [
                "Cause-and-effect narrative",
                "Descriptive classification",
                "Problem-focused with implied causes",
                "Sequential process description",
            ],
            "correct": 2,
            "explanation": "Headings about 'decline' typically introduce a problem and explore contributing factors.",
        },
        {
            "question": "When matching headings to paragraphs, which approach is most effective?",
            "options": [
                "Read all headings first, then skim each paragraph for the main idea",
                "Read the paragraph word-for-word and find exact heading phrases",
                "Skip the first and last paragraphs",
                "Match headings alphabetically to paragraphs",
            ],
            "correct": 0,
            "explanation": "Reading headings first lets you predict the theme before skimming for the main idea.",
        },
        {
            "question": "The passage says: 'While productivity increased, employee wellbeing declined.' What rhetorical device is used?",
            "options": ["Alliteration", "Concession and contrast", "Rhetorical question", "Personification"],
            "correct": 1,
            "explanation": "'While' introduces a concession; the clause that follows provides a contrasting outcome.",
        },
        {
            "question": "If a passage states 'Research suggests X' — what does this indicate about certainty?",
            "options": [
                "X is proven beyond doubt",
                "X is an unverified personal opinion",
                "X is a tentative claim with some evidence",
                "X has been officially rejected",
            ],
            "correct": 2,
            "explanation": "Hedging language like 'suggests' signals a tentative, evidence-based claim, not a certainty.",
        },
        {
            "question": "Which of the following is a 'Not Given' answer in IELTS Reading?",
            "options": [
                "The passage directly contradicts it",
                "The passage confirms it with exact words",
                "The passage implies the opposite meaning",
                "The passage neither confirms nor contradicts it",
            ],
            "correct": 3,
            "explanation": "'Not Given' means the passage provides no information — not that it's false.",
        },
        {
            "question": "A question asks: 'What does the author IMPLY about solar energy?' — what should you focus on?",
            "options": [
                "Explicitly stated facts only",
                "Meaning suggested between the lines",
                "The author's biography",
                "Other articles mentioned in the passage",
            ],
            "correct": 1,
            "explanation": "'Imply' means the meaning is suggested indirectly — read between the lines.",
        },
    ],
    "listening": [
        {
            "question": "A speaker says: 'The seminar starts at quarter past nine, not nine-thirty.' What time should you write?",
            "options": ["9:05", "9:15", "9:30", "9:45"],
            "correct": 1,
            "explanation": "Quarter past nine = 9:15. The speaker corrects the time explicitly.",
        },
        {
            "question": "Which listening skill is most useful for IELTS Section 1 form completion?",
            "options": [
                "Accurate spelling and number recognition",
                "Advanced literary analysis",
                "Identifying abstract themes",
                "Memorising all synonyms beforehand",
            ],
            "correct": 0,
            "explanation": "Section 1 tests practical details: names, dates, phone numbers, and spelling.",
        },
        {
            "question": "In Section 4 (academic monologue), what should you focus on?",
            "options": [
                "Main ideas and supporting evidence",
                "Speaker's tone only",
                "Background noise to filter it out",
                "Reading speed during the recording",
            ],
            "correct": 0,
            "explanation": "Section 4 is complex and lecture-style — follow main arguments and their evidence.",
        },
        {
            "question": "A speaker spells out: 'That's M-A-C-K-E-N-Z-I-E.' What should you write?",
            "options": ["Mackenzie", "Mckenzie", "Makenzie", "Mackenzy"],
            "correct": 0,
            "explanation": "Following the letters given: M-A-C-K-E-N-Z-I-E = Mackenzie.",
        },
        {
            "question": "Before the IELTS Listening test begins, what is the most effective strategy?",
            "options": [
                "Read questions and predict answer types",
                "Wait and listen without reading anything",
                "Memorise the answer sheet layout",
                "Skip the instructions section",
            ],
            "correct": 0,
            "explanation": "Predicting answer types (number, name, place, etc.) before listening improves accuracy.",
        },
        {
            "question": "The speaker says: 'Registrations close on the fourteenth — that's a Friday.' What is the deadline?",
            "options": ["Friday the 4th", "Thursday the 14th", "Friday the 14th", "The last Friday"],
            "correct": 2,
            "explanation": "The speaker gives both the date (14th) and day (Friday) — combine both for the answer.",
        },
        {
            "question": "In map labelling questions, which approach is most effective?",
            "options": [
                "Study cardinal directions (N/S/E/W) and landmarks before listening",
                "Draw your own map while listening",
                "Wait until the end of the recording to fill in labels",
                "Guess based on alphabetical order",
            ],
            "correct": 0,
            "explanation": "Orientation before listening lets you track movement descriptions accurately.",
        },
        {
            "question": "A speaker uses the word 'however' — what does this signal?",
            "options": [
                "A new topic unrelated to the previous one",
                "A contrast or exception to the previous point",
                "The end of the conversation",
                "Agreement with the previous speaker",
            ],
            "correct": 1,
            "explanation": "'However' is a contrast signal — the information that follows will contradict or qualify what came before.",
        },
    ],
    "writing": [
        {
            "question": "For IELTS Writing Task 2, which structure earns the highest Coherence and Cohesion score?",
            "options": [
                "Introduction → Body 1 (topic sentence + argument + example) → Body 2 → Conclusion",
                "One long paragraph with all ideas jumbled together",
                "Bullet points followed by a summary",
                "Stream of consciousness without paragraphs",
            ],
            "correct": 0,
            "explanation": "Clear paragraphing with topic sentences and logical flow is rewarded under CC criteria.",
        },
        {
            "question": "What improves your Lexical Resource (LR) score in Writing?",
            "options": [
                "Using varied, precise vocabulary naturally in context",
                "Repeating the same advanced words 10 times",
                "Using slang and informal abbreviations",
                "Avoiding all complex vocabulary to prevent errors",
            ],
            "correct": 0,
            "explanation": "Natural variety and precision are rewarded. Overuse or forced complexity are penalised.",
        },
        {
            "question": "In Task 1 (Academic), which element is essential in the overview paragraph?",
            "options": [
                "Every single data point from the chart",
                "The main trend or most significant feature",
                "Your personal opinion on the data",
                "A prediction about the future",
            ],
            "correct": 1,
            "explanation": "The overview summarises the most significant overall trend — without it, Band 5 or lower.",
        },
        {
            "question": "Which phrase correctly introduces a counter-argument in Task 2?",
            "options": [
                "On the other hand, critics argue that…",
                "Very importantly however,",
                "But opposite people think,",
                "Nevertheless I agree because,",
            ],
            "correct": 0,
            "explanation": "'On the other hand' is a natural, formal way to introduce the opposing view.",
        },
        {
            "question": "What word count should you aim for in IELTS Writing Task 2?",
            "options": [
                "Exactly 250 words — no more, no less",
                "At least 250 words (more is fine if quality is maintained)",
                "Under 200 words for clarity",
                "As many words as possible regardless of relevance",
            ],
            "correct": 1,
            "explanation": "You must write at least 250 words. Going slightly over is acceptable if relevant.",
        },
        {
            "question": "Which task response approach scores highest for a 'discuss both views' question?",
            "options": [
                "Present both views clearly, then give a balanced or supported personal opinion",
                "Choose one view and ignore the other completely",
                "Agree with whichever view the examiner seems to prefer",
                "Write only about global trends without addressing the question",
            ],
            "correct": 0,
            "explanation": "You must address BOTH views. Your opinion can be balanced or lean one way — but address both.",
        },
        {
            "question": "What does 'Task Achievement' measure in Writing Task 2?",
            "options": [
                "How clearly you addressed all parts of the question",
                "The number of vocabulary items used",
                "Your handwriting clarity",
                "Whether you used passive voice",
            ],
            "correct": 0,
            "explanation": "TA checks if you answered ALL parts of the question fully and with relevant ideas.",
        },
        {
            "question": "Which transition best shows a result or consequence?",
            "options": ["However", "In contrast", "Consequently", "For instance"],
            "correct": 2,
            "explanation": "'Consequently' introduces a result. 'However' = contrast; 'For instance' = example.",
        },
    ],
    "speaking": [
        {
            "question": "In IELTS Speaking Part 2, you have 1 minute to prepare. What is the best use of this time?",
            "options": [
                "Write a word outline for each bullet point on the cue card",
                "Write out every sentence you plan to say",
                "Spend 30 seconds panicking and 30 seconds writing",
                "Ignore the cue card and speak freely",
            ],
            "correct": 0,
            "explanation": "Brief bullet notes for each prompt point keeps you on track for the full 2 minutes.",
        },
        {
            "question": "Which response demonstrates better Fluency and Coherence?",
            "options": [
                "'Um, I think, um, technology is, like, you know, good for, um, students.'",
                "'Technology benefits students significantly — for example, it provides instant access to resources.'",
                "'Technology. Students. Resources. Good.'",
                "'I don't know much about this topic, sorry.'",
            ],
            "correct": 1,
            "explanation": "Fluent, well-structured sentences with an example demonstrate coherence and range.",
        },
        {
            "question": "What does the examiner assess in Part 3 (Discussion)?",
            "options": [
                "Your ability to discuss abstract ideas with developed reasoning",
                "Whether you memorised prepared answers",
                "Your knowledge of current events",
                "Pronunciation of specific technical words only",
            ],
            "correct": 0,
            "explanation": "Part 3 tests abstract thinking, opinion development, and coherent reasoning.",
        },
        {
            "question": "Which filler phrase is MOST acceptable in IELTS Speaking?",
            "options": [
                "'Um, um, uh, like…'",
                "'That's an interesting question — let me think about that for a moment.'",
                "'I don't know.' (repeated)",
                "'Can I have the next question?'",
            ],
            "correct": 1,
            "explanation": "Buying time naturally is fine — it's far better than excessive fillers or silence.",
        },
        {
            "question": "To improve your Grammatical Range score in Speaking, you should:",
            "options": [
                "Mix simple, compound, and complex sentence types naturally",
                "Use only simple sentences to avoid errors",
                "Repeat the same tense throughout",
                "Avoid relative clauses entirely",
            ],
            "correct": 0,
            "explanation": "Range means using different structures. Accuracy across various structures is rewarded.",
        },
        {
            "question": "What does 'Pronunciation' scoring in IELTS Speaking focus on?",
            "options": [
                "Having a British or American accent",
                "Clear articulation and effective use of stress, rhythm, and intonation",
                "Never making any sound errors",
                "Reading aloud perfectly without hesitation",
            ],
            "correct": 1,
            "explanation": "Accent doesn't matter — intelligibility through stress, rhythm, and intonation does.",
        },
    ],
    "mock_ielts": [
        {
            "question": "Which IELTS band score is typically required for UK university admission?",
            "options": ["5.0", "5.5", "6.0–6.5", "9.0"],
            "correct": 2,
            "explanation": "Most UK universities require 6.0–6.5 overall, with no band below 5.5 or 6.0.",
        },
        {
            "question": "How long is the IELTS Academic Writing test?",
            "options": ["30 minutes", "60 minutes", "90 minutes", "2 hours"],
            "correct": 1,
            "explanation": "IELTS Writing is 60 minutes: ~20 min for Task 1 and ~40 min for Task 2.",
        },
        {
            "question": "How many sections does the IELTS Listening test have?",
            "options": ["2", "3", "4", "5"],
            "correct": 2,
            "explanation": "IELTS Listening has 4 sections, each with 10 questions (40 total).",
        },
        {
            "question": "In IELTS Academic Reading, how many questions are there in total?",
            "options": ["30", "35", "40", "45"],
            "correct": 2,
            "explanation": "IELTS Academic Reading: 3 passages, 40 questions in 60 minutes.",
        },
        {
            "question": "What is the maximum band score achievable in each IELTS skill?",
            "options": ["7.0", "8.0", "9.0", "10.0"],
            "correct": 2,
            "explanation": "Each skill is marked out of 9.0. The overall band is the average of all four.",
        },
        {
            "question": "In IELTS Speaking Part 2, how long must you speak for?",
            "options": ["30 seconds", "1 minute", "1–2 minutes", "3 minutes"],
            "correct": 2,
            "explanation": "You must speak for 1–2 minutes. Stopping early significantly lowers your Fluency score.",
        },
    ],
    "learning": [
        {
            "question": "Which weekly plan best supports IELTS band improvement?",
            "options": [
                "Balanced practice across reading, listening, writing, and speaking daily",
                "Only mock tests every day",
                "Only grammar drills for a month",
                "No revision — only new content",
            ],
            "correct": 0,
            "explanation": "Balanced daily skill coverage with review is more effective than single-skill cramming.",
        },
        {
            "question": "What is the most useful way to use teacher feedback?",
            "options": [
                "Convert repeated mistakes into targeted drills",
                "Ignore low-scoring sections",
                "Switch strategy after every session",
                "Focus exclusively on strengths",
            ],
            "correct": 0,
            "explanation": "Deliberate practice on recurring errors improves score consistency over time.",
        },
        {
            "question": "How many days before your IELTS exam should you attempt a full mock test?",
            "options": [
                "The night before",
                "2–4 weeks before (with time to act on results)",
                "On the same day",
                "Mock tests are not useful",
            ],
            "correct": 1,
            "explanation": "Mocks 2–4 weeks out leave enough time to identify and fix weaknesses before exam day.",
        },
        {
            "question": "Which habit most reliably builds IELTS Reading speed?",
            "options": [
                "Daily timed reading of academic articles with comprehension checks",
                "Reading fiction novels only",
                "Memorising dictionary definitions daily",
                "Watching TV with subtitles only",
            ],
            "correct": 0,
            "explanation": "Academic reading builds the vocabulary density and skimming skills needed for IELTS passages.",
        },
        {
            "question": "What does a streak in your IELTS training represent?",
            "options": [
                "Number of questions answered in one sitting",
                "Consecutive days of completing at least one practice task",
                "Total number of mock tests taken",
                "Score improvement across sessions",
            ],
            "correct": 1,
            "explanation": "A streak tracks daily consistency — the single strongest predictor of long-term improvement.",
        },
        {
            "question": "Which factor most distinguishes Band 7 from Band 8 in Writing?",
            "options": [
                "Word count alone",
                "Consistent control of complex grammar and varied sophisticated vocabulary",
                "Number of paragraphs",
                "How quickly the essay was written",
            ],
            "correct": 1,
            "explanation": "Band 8 demands consistent sophistication in both grammar and vocabulary — rare errors only.",
        },
        {
            "question": "For a student stuck at Band 6, which focus area yields the fastest improvement?",
            "options": [
                "Identifying and drilling the specific question types they consistently fail",
                "Studying all four skills equally with no prioritisation",
                "Memorising Band 9 model answers word-for-word",
                "Switching from Academic to General Training",
            ],
            "correct": 0,
            "explanation": "Targeted drilling of weak question types is the highest-leverage way to break through a plateau.",
        },
        {
            "question": "What is 'spaced repetition' and why is it useful for IELTS vocabulary?",
            "options": [
                "Reading the same word list every day — repetition is key",
                "Reviewing vocabulary at increasing intervals to move it into long-term memory",
                "Learning 100 new words in one session per week",
                "Spacing out vocabulary books on a physical shelf",
            ],
            "correct": 1,
            "explanation": "Spaced repetition (e.g. Anki) is scientifically proven to maximise long-term retention.",
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
    if not resources:
        return []

    # sample primary resources without replacement to avoid repeated stems
    pick_count = min(question_count, len(resources))
    primary_resources = random.sample(resources, k=pick_count)

    questions = []
    for answer in primary_resources:
        # build options: include the correct answer and up to 3 distractors
        distractors = [r for r in resources if r.id != answer.id]
        option_count = min(3, len(distractors))
        option_set = random.sample(distractors, k=option_count) if option_count > 0 else []
        option_set = option_set + [answer]
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
        # If resource-based answers are fewer than requested, try to top up from fallback
        if len(generated_questions) < question_count:
            needed = question_count - len(generated_questions)
            more = _fallback_questions(category, needed)
            generated_questions.extend(more)

        # Deduplicate by normalized question text
        unique = []
        seen = set()
        for itm in generated_questions:
            qtext = (itm.get('question') or '').strip().lower()
            if qtext and qtext not in seen:
                seen.add(qtext)
                unique.append(itm)

        # If still short, attempt to expand using paraphrases of existing items
        if len(unique) < question_count:
            needed = question_count - len(unique)
            # try generating paraphrases from fallback bank first
            bank_candidates = []
            bank_candidates.extend(_fallback_questions(category, min(6, 6)))
            # include existing unique items as candidates for paraphrasing
            bank_candidates.extend(unique)

            for candidate in bank_candidates:
                if len(unique) >= question_count:
                    break
                base_q = candidate.get('question')
                if not base_q:
                    continue
                variants = paraphrase_text(base_q, max_variants=3)
                for v in variants:
                    if len(unique) >= question_count:
                        break
                    v_norm = v.strip().lower()
                    if v_norm in seen:
                        continue
                    # create a new item copying options/explanation (if available)
                    new_item = {
                        'question': v,
                        'options': candidate.get('options', [])[:],
                        'correct': candidate.get('correct', 0),
                        'explanation': candidate.get('explanation', ''),
                    }
                    seen.add(v_norm)
                    unique.append(new_item)

        generated_questions = unique

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


@quizzes_bp.route("/<int:quiz_id>", methods=["DELETE"])
@jwt_required()
def delete_quiz(quiz_id):
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    quiz = Quiz.query.get_or_404(quiz_id)
    # remove related questions and attempts
    QuizQuestion.query.filter_by(quiz_id=quiz.id).delete()
    QuizAttempt.query.filter_by(quiz_id=quiz.id).delete()
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted"})


@quizzes_bp.route("/<int:quiz_id>", methods=["PATCH"])
@jwt_required()
def update_quiz(quiz_id):
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json(silent=True) or {}
    for field in ["title", "category", "difficulty", "time_limit_min"]:
        if field in data:
            setattr(quiz, field, data[field])
    db.session.commit()
    return jsonify(quiz.to_dict())


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


@resources_bp.route("/<int:resource_id>", methods=["PATCH"])
@jwt_required()
def update_resource(resource_id):
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    r = Resource.query.get_or_404(resource_id)
    data = request.get_json(silent=True) or {}
    for field in ["title", "description", "category", "type", "url"]:
        if field in data:
            setattr(r, field, data[field])
    db.session.commit()
    return jsonify(r.to_dict())