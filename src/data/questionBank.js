export const GRAMMAR_QUESTIONS = [
  { id: 'G001', q: "Choose the correct passive: 'The project ___ by the team last week.'", opts: ['was completed', 'is completed', 'were completed', 'has completed'], c: 0, exp: "Past passive = was/were + past participle. 'Project' is singular.", diff: 'beginner', tag: 'passive-voice' },
  { id: 'G002', q: 'Which sentence uses a relative clause correctly?', opts: ['The student who passed was happy.', 'The student which passed was happy.', 'The student that he passed was happy.', 'The student, he passed, was happy.'], c: 0, exp: "Use 'who' for people.", diff: 'beginner', tag: 'relative-clauses' },
  { id: 'G003', q: "Select the correct conditional: 'If I ___ harder, I would have passed.'", opts: ['study', 'studied', 'had studied', 'have studied'], c: 2, exp: 'Third conditional uses past perfect.', diff: 'intermediate', tag: 'conditionals' },
  { id: 'G004', q: "Identify the error: 'The informations provided were useful.'", opts: ["'informations' -> 'information'", "'were' -> 'was'", "'provided' -> 'providing'", 'No error'], c: 0, exp: "'Information' is uncountable.", diff: 'beginner', tag: 'countable-uncountable' },
  { id: 'G005', q: "'Despite ___ the rain, the match continued.' - choose the correct form.", opts: ['of', 'despite', 'that', 'nothing'], c: 3, exp: "'Despite' is followed by a noun phrase.", diff: 'intermediate', tag: 'prepositions' },
  { id: 'G006', q: "Choose the correct article: '___ IELTS exam tests four key skills.'", opts: ['A', 'An', 'The', 'No article'], c: 2, exp: "'The IELTS exam' refers to a known exam.", diff: 'beginner', tag: 'articles' },
  { id: 'G007', q: 'Which phrase correctly shows contrast?', opts: ['Furthermore, the results improved.', 'Nevertheless, the results improved.', 'Similarly, the results improved.', 'Consequently, the results improved.'], c: 1, exp: "'Nevertheless' introduces contrast.", diff: 'intermediate', tag: 'linking-words' },
  { id: 'G008', q: 'She suggested ___ the library for revision.', opts: ['to visit', 'visiting', 'visit', 'visited'], c: 1, exp: "'Suggest' is followed by gerund.", diff: 'beginner', tag: 'gerunds-infinitives' },
  { id: 'G009', q: "Which is correct? 'The number of students ___ increasing.'", opts: ['are', 'were', 'is', 'have been'], c: 2, exp: "'The number of' is singular.", diff: 'intermediate', tag: 'subject-verb-agreement' },
  { id: 'G010', q: "Pick the correct comparative: 'This essay is ___ the previous one.'", opts: ['more better than', 'better than', 'more good than', 'gooder than'], c: 1, exp: "'Better' is already comparative.", diff: 'beginner', tag: 'comparatives' },
];

export const VOCAB_QUESTIONS = [
  { id: 'V001', q: "What does 'ubiquitous' mean?", opts: ['Extremely rare', 'Appearing everywhere', 'Highly dangerous', 'Difficult to understand'], c: 1, exp: "'Ubiquitous' means present everywhere.", diff: 'intermediate', tag: 'academic-vocab' },
  { id: 'V002', q: "'Make or do?' - '___ a mistake'", opts: ['Do', 'Make', 'Have', 'Take'], c: 1, exp: "'Make a mistake' is correct.", diff: 'beginner', tag: 'collocations' },
  { id: 'V003', q: "Which word best replaces 'important' for a higher IELTS band?", opts: ['Big', 'Crucial', 'Main', 'Good'], c: 1, exp: "'Crucial' is more precise/formal.", diff: 'beginner', tag: 'synonyms' },
  { id: 'V004', q: "What does 'mitigate' mean?", opts: ['To worsen something', 'To measure something', 'To lessen severity', 'To ignore a problem'], c: 2, exp: "'Mitigate' means reduce severity.", diff: 'intermediate', tag: 'academic-vocab' },
  { id: 'V005', q: "Which word means 'to make something significantly worse'?", opts: ['Alleviate', 'Exacerbate', 'Mitigate', 'Ameliorate'], c: 1, exp: "'Exacerbate' means worsen.", diff: 'intermediate', tag: 'academic-vocab' },
  { id: 'V006', q: "What is the noun form of 'analyse'?", opts: ['Analysing', 'Analysed', 'Analysis', 'Analyst'], c: 2, exp: "'Analysis' is the noun.", diff: 'beginner', tag: 'word-forms' },
  { id: 'V007', q: "Academic paraphrase of 'people think':", opts: ['Scholars argue', 'Guys believe', 'Folks reckon', 'Persons say'], c: 0, exp: "'Scholars argue' is formal.", diff: 'intermediate', tag: 'academic-register' },
  { id: 'V008', q: "'The policy had a ___ effect on employment.' - best fit:", opts: ['deleterious', 'nice', 'good', 'regular'], c: 0, exp: "'Deleterious' means harmful.", diff: 'advanced', tag: 'academic-vocab' },
  { id: 'V009', q: "Choose the correct collocation: '___ a decision'", opts: ['Do', 'Make', 'Have', 'Take'], c: 1, exp: "'Make a decision' is correct.", diff: 'beginner', tag: 'collocations' },
  { id: 'V010', q: "'The research ___ several unexpected patterns.' - best verb?", opts: ['showed', 'told', 'said', 'spoke'], c: 0, exp: "Research 'shows' or 'reveals'.", diff: 'beginner', tag: 'academic-verbs' },
];

export const READING_QUESTIONS = [
  { id: 'R001', q: 'In IELTS Reading, which strategy best helps with True/False/Not Given questions?', opts: ['Match meaning precisely, not just keywords', 'Read only the questions', 'Always choose Not Given when unsure', 'Skip unfamiliar paragraphs'], c: 0, exp: 'Paraphrase matching is key.', diff: 'intermediate', tag: 'tfng-strategy' },
  { id: 'R002', q: "What does 'Not Given' mean in IELTS Reading?", opts: ['The passage contradicts it', 'The passage confirms it', 'The passage implies the opposite', 'The passage neither confirms nor contradicts it'], c: 3, exp: "'Not Given' means insufficient information.", diff: 'beginner', tag: 'tfng' },
  { id: 'R003', q: 'When matching headings to paragraphs, which approach is most effective?', opts: ['Read headings first then skim paragraphs', 'Match headings alphabetically', 'Read everything word-for-word first', 'Skip introduction and conclusion'], c: 0, exp: 'Skim for main idea after previewing headings.', diff: 'intermediate', tag: 'heading-matching' },
  { id: 'R004', q: "A passage says: 'Research suggests X.' What level of certainty does this indicate?", opts: ['Proven beyond doubt', 'Unverified opinion', 'Tentative evidence-based claim', 'Officially rejected'], c: 2, exp: "'Suggests' indicates hedged claim.", diff: 'advanced', tag: 'hedging' },
  { id: 'R005', q: 'Which reading technique is best for quickly finding a specific name or date?', opts: ['Skimming', 'Scanning', 'Intensive reading', 'Extensive reading'], c: 1, exp: 'Scanning finds specific details quickly.', diff: 'beginner', tag: 'reading-skills' },
];

export const LISTENING_QUESTIONS = [
  { id: 'L001', q: "A speaker says: 'The seminar starts at quarter past nine, not nine-thirty.' What time?", opts: ['9:05', '9:15', '9:30', '9:45'], c: 1, exp: 'Quarter past nine is 9:15.', diff: 'beginner', tag: 'number-recognition' },
  { id: 'L002', q: 'Which listening skill is most critical for Section 1 form completion?', opts: ['Accurate spelling and number recognition', 'Advanced literary analysis', 'Identifying abstract themes', 'Memorising all synonyms'], c: 0, exp: 'Section 1 is practical detail heavy.', diff: 'beginner', tag: 'section-1' },
  { id: 'L003', q: "A speaker spells: 'M-A-C-K-E-N-Z-I-E.' What should you write?", opts: ['Mackenzie', 'Mckenzie', 'Makenzie', 'Mackenzy'], c: 0, exp: 'Letter-by-letter gives Mackenzie.', diff: 'beginner', tag: 'spelling' },
  { id: 'L004', q: 'Before Listening starts, what is most effective?', opts: ['Read questions and predict answer types', 'Wait and listen without reading', 'Memorise answer sheet layout', 'Skip instructions'], c: 0, exp: 'Prediction improves focus.', diff: 'intermediate', tag: 'exam-strategy' },
  { id: 'L005', q: 'In Section 4 (academic lecture), what should you prioritise?', opts: ['Main ideas and supporting evidence', 'Speaker tone only', 'Background noise', 'Reading speed'], c: 0, exp: 'Track argument and evidence.', diff: 'intermediate', tag: 'section-4' },
];

export const WRITING_QUESTIONS = [
  { id: 'W001', q: 'For Task 2, which structure earns the highest Coherence and Cohesion score?', opts: ['Intro + Body 1 + Body 2 + Conclusion', 'One long paragraph', 'Bullet points + summary', 'Stream of consciousness'], c: 0, exp: 'Clear paragraphing and development wins.', diff: 'intermediate', tag: 'essay-structure' },
  { id: 'W002', q: 'What improves Lexical Resource in Writing?', opts: ['Varied, precise vocabulary used naturally', 'Repeat the same advanced words', 'Use slang', 'Avoid complex vocabulary'], c: 0, exp: 'Natural precision and variety are rewarded.', diff: 'beginner', tag: 'lexical-resource' },
  { id: 'W003', q: 'In Task 1 (Academic), what must the overview include?', opts: ['Every data point', 'Main trend or key feature', 'Personal opinion', 'Future prediction'], c: 1, exp: 'Overview is mandatory for higher bands.', diff: 'intermediate', tag: 'task-1-overview' },
  { id: 'W004', q: 'Which phrase correctly introduces a counter-argument?', opts: ['On the other hand, critics argue that...', 'Very importantly however,', 'But opposite people think,', 'Nevertheless I agree because,'], c: 0, exp: 'Formal and natural contrast phrase.', diff: 'beginner', tag: 'counter-argument' },
  { id: 'W005', q: 'What word count should you aim for in Task 2?', opts: ['Exactly 250', 'At least 250', 'Under 200', 'As many as possible'], c: 1, exp: 'Minimum is 250 words.', diff: 'beginner', tag: 'word-count' },
];

export const SPEAKING_QUESTIONS = [
  { id: 'SP001', q: 'In Part 2, best use of the 1-minute prep?', opts: ['Write a word outline for each bullet', 'Write every sentence', 'Panic then write', 'Ignore cue card'], c: 0, exp: 'Bullet-note outline supports fluency.', diff: 'beginner', tag: 'part-2-strategy' },
  { id: 'SP002', q: 'Which response shows better Fluency and Coherence?', opts: ['Um... like... good...', 'Technology benefits students significantly because...', 'Technology. Students. Good.', "I don't know."], c: 1, exp: 'Structured response with reason and example.', diff: 'beginner', tag: 'fluency' },
  { id: 'SP003', q: 'What does examiner assess in Part 3?', opts: ['Abstract discussion with developed reasoning', 'Memorised answers', 'Only current events knowledge', 'Technical pronunciation only'], c: 0, exp: 'Part 3 tests abstract reasoning and development.', diff: 'intermediate', tag: 'part-3' },
  { id: 'SP004', q: 'Which filler phrase is most acceptable?', opts: ['Um, um, uh...', "That's an interesting question, let me think...", "I don't know", 'Next question please'], c: 1, exp: 'Natural thinking phrase is acceptable.', diff: 'beginner', tag: 'fillers' },
  { id: 'SP005', q: 'To improve Grammatical Range in Speaking, you should:', opts: ['Mix simple, compound, and complex sentences', 'Use only simple sentences', 'Repeat one tense', 'Avoid relative clauses'], c: 0, exp: 'Range requires varied structures.', diff: 'intermediate', tag: 'grammatical-range' },
];

export const TEST_KNOWLEDGE_QUESTIONS = [
  { id: 'TK001', q: 'Which IELTS band score is typically required for UK university admission?', opts: ['5.0', '5.5', '6.0-6.5', '9.0'], c: 2, exp: 'Typical requirement is around 6.0-6.5 overall.', diff: 'beginner', tag: 'band-requirements' },
  { id: 'TK002', q: 'How long is the IELTS Academic Writing test?', opts: ['30 min', '60 min', '90 min', '2 hours'], c: 1, exp: 'Writing test duration is 60 minutes.', diff: 'beginner', tag: 'test-timing' },
  { id: 'TK003', q: 'How many sections in IELTS Listening?', opts: ['2', '3', '4', '5'], c: 2, exp: 'Listening has 4 sections.', diff: 'beginner', tag: 'test-structure' },
  { id: 'TK004', q: 'How many total questions in IELTS Academic Reading?', opts: ['30', '35', '40', '45'], c: 2, exp: 'Reading has 40 questions.', diff: 'beginner', tag: 'test-structure' },
  { id: 'TK005', q: 'Maximum band score per skill?', opts: ['7.0', '8.0', '9.0', '10.0'], c: 2, exp: 'Each skill is scored out of Band 9.', diff: 'beginner', tag: 'scoring' },
];

export const ADVANCED_QUESTIONS = [
  { id: 'A001', q: 'Which feature most distinguishes Band 7 from Band 8 in writing?', opts: ['Word count', 'Consistent control of complex grammar and sophisticated vocabulary', 'Number of paragraphs', 'Writing speed'], c: 1, exp: 'Band 8 requires sustained control and precision.', diff: 'advanced', tag: 'band-descriptors' },
  { id: 'A002', q: "What is 'hedging' in academic writing?", opts: ['Cautious language to avoid overclaiming', 'Very strong assertions', 'Repeating facts', 'Using short sentences only'], c: 0, exp: 'Hedging uses cautious claims like may/suggests.', diff: 'advanced', tag: 'hedging' },
  { id: 'A003', q: 'For a student stuck at Band 6, what often improves fastest?', opts: ['Target weak question types with drills', 'Study all skills equally always', 'Memorise Band 9 essays', 'Switch test type'], c: 0, exp: 'Targeted drilling has highest leverage.', diff: 'advanced', tag: 'study-strategy' },
  { id: 'A004', q: "What is 'lexical sophistication'?", opts: ['Longest words possible', 'Precise less-common vocabulary used accurately', 'Technical jargon in every sentence', 'Only formal sentence style'], c: 1, exp: 'Precision and appropriateness matter most.', diff: 'advanced', tag: 'band-descriptors' },
  { id: 'A005', q: "What does 'cohesion' refer to?", opts: ['Paragraph topic sentences', 'Sentence-level connection through linkers and references', 'Formal vocabulary', 'Intro and conclusion presence'], c: 1, exp: 'Cohesion links ideas across and within sentences.', diff: 'advanced', tag: 'cohesion' },
];

export const SPEAKING_CUE_CARDS = [
  { id: 'SC001', topic: 'A memorable journey', prompt: 'Describe a memorable journey you have taken.', points: ['Where you went', 'How you travelled', 'Who you went with', 'Why it was memorable'], part: 2 },
  { id: 'SC002', topic: 'A person who inspired you', prompt: 'Describe a person who influenced your life.', points: ['Who this person is', 'How you met them', 'What they did', 'Why they inspired you'], part: 2 },
  { id: 'SC003', topic: 'A skill you want to learn', prompt: 'Describe a skill you would like to learn in the future.', points: ['What the skill is', 'Why you want it', 'How you would learn it', 'How it would help'], part: 2 },
  { id: 'SC004', topic: 'Technology you use', prompt: 'Describe a piece of technology you use frequently.', points: ['What it is', 'When you started using it', 'How you use it', 'Why it is important'], part: 2 },
  { id: 'SC005', topic: 'A happy childhood memory', prompt: 'Describe a happy memory from your childhood.', points: ['What happened', 'When and where', 'Who was involved', 'Why it is memorable'], part: 2 },
];

export const WRITING_PROMPTS = [
  { id: 'WP001', type: 'Task 2 - Discussion', prompt: 'Some people argue rapid technological advances reduce workforce dependency, while others disagree. Discuss both views and give your opinion.', criteria: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'], wordTarget: 250, timeMin: 40 },
  { id: 'WP002', type: 'Task 2 - Agree/Disagree', prompt: 'Governments should invest more in public transportation than in new roads. To what extent do you agree or disagree?', criteria: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'], wordTarget: 250, timeMin: 40 },
  { id: 'WP003', type: 'Task 2 - Problem/Solution', prompt: 'The number of people choosing to live alone has increased. What are the reasons and problems?', criteria: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'], wordTarget: 250, timeMin: 40 },
  { id: 'WP004', type: 'Task 1 - Line Graph', prompt: 'The graph shows internet access between 2000 and 2020. Summarise the main features.', criteria: ['Task Achievement', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'], wordTarget: 150, timeMin: 20 },
  { id: 'WP005', type: 'Task 1 - Process Diagram', prompt: 'The diagram shows how solar panels generate electricity. Summarise the process.', criteria: ['Task Achievement', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'], wordTarget: 150, timeMin: 20 },
];

export const QUESTION_BANK = {
  grammar: GRAMMAR_QUESTIONS,
  vocabulary: VOCAB_QUESTIONS,
  reading: READING_QUESTIONS,
  listening: LISTENING_QUESTIONS,
  writing: WRITING_QUESTIONS,
  speaking: SPEAKING_QUESTIONS,
  test_knowledge: TEST_KNOWLEDGE_QUESTIONS,
  advanced: ADVANCED_QUESTIONS,
};

export const ALL_QUESTIONS = [
  ...GRAMMAR_QUESTIONS,
  ...VOCAB_QUESTIONS,
  ...READING_QUESTIONS,
  ...LISTENING_QUESTIONS,
  ...WRITING_QUESTIONS,
  ...SPEAKING_QUESTIONS,
  ...TEST_KNOWLEDGE_QUESTIONS,
  ...ADVANCED_QUESTIONS,
];

export const CATEGORIES = [
  { id: 'grammar', label: 'Grammar', icon: '📝', color: '#146c72', count: GRAMMAR_QUESTIONS.length },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚', color: '#6b46c1', count: VOCAB_QUESTIONS.length },
  { id: 'reading', label: 'Reading', icon: '📖', color: '#b7791f', count: READING_QUESTIONS.length },
  { id: 'listening', label: 'Listening', icon: '🎧', color: '#2f855a', count: LISTENING_QUESTIONS.length },
  { id: 'writing', label: 'Writing', icon: '✍️', color: '#2b6cb0', count: WRITING_QUESTIONS.length },
  { id: 'speaking', label: 'Speaking', icon: '🎙️', color: '#c53030', count: SPEAKING_QUESTIONS.length },
  { id: 'test_knowledge', label: 'Test Knowledge', icon: '🏆', color: '#d69429', count: TEST_KNOWLEDGE_QUESTIONS.length },
  { id: 'advanced', label: 'Band 7+ Focus', icon: '⭐', color: '#0f4c5c', count: ADVANCED_QUESTIONS.length },
];

export function getQuestions(category, count = 10, difficulty = null) {
  const pool = QUESTION_BANK[category] || ALL_QUESTIONS;
  const filtered = difficulty ? pool.filter((q) => q.diff === difficulty) : pool;
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getMixedQuiz(count = 15) {
  const result = [];
  for (const cat of Object.keys(QUESTION_BANK)) {
    const pool = QUESTION_BANK[cat];
    if (pool.length > 0) result.push(pool[Math.floor(Math.random() * pool.length)]);
    if (result.length >= count) break;
  }
  if (result.length < count) {
    const extras = [...ALL_QUESTIONS]
      .filter((q) => !result.find((r) => r.id === q.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count - result.length);
    result.push(...extras);
  }
  return result.sort(() => Math.random() - 0.5);
}

export function getAdaptiveQuestions(weakAreas = [], count = 10) {
  const priority = [];
  const rest = [];
  for (const q of ALL_QUESTIONS) {
    const matches = weakAreas.some((area) =>
      q.tag?.includes(area.toLowerCase()) || q.id.startsWith(area[0]?.toUpperCase())
    );
    (matches ? priority : rest).push(q);
  }
  const shuffledPriority = priority.sort(() => Math.random() - 0.5);
  const shuffledRest = rest.sort(() => Math.random() - 0.5);
  return [...shuffledPriority, ...shuffledRest].slice(0, count);
}

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;
