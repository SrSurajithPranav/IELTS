"""
AI helper utilities.
- check_grammar  -> LanguageTool public REST API (free, no key needed)
- speech_to_text -> Web Speech API is handled client-side; this is the server fallback
"""

import requests

LANGUAGETOOL_URL = "https://api.languagetool.org/v2/check"

def speech_to_text(audio_url: str) -> dict:
    """
    Server-side STT placeholder.
    Real transcription is done client-side via Web Speech API.
    """
    return {
        'transcript': '',
        "confidence": 0.0,
        "mock": True,
        'note': 'Use Web Speech API on client for real-time transcription'
    }

def check_grammar(text: str) -> dict:
    """
    Real grammar check via LanguageTool public API.
    No API key required. Returns a compatible shape for existing routes.
    """
    words = text.split()
    sentences = [s for s in text.split('.') if s.strip()]
    long_words = [w for w in words if len(w) > 7]
    avg_sent_len = len(words) / max(len(sentences), 1)

    lt_matches = []
    try:
        resp = requests.post(
            LANGUAGETOOL_URL,
            data={'text': text, 'language': 'en-GB'},
            timeout=8
        )
        if resp.status_code == 200:
            lt_matches = resp.json().get('matches', [])
    except Exception as e:
        print(f'[LanguageTool] request failed: {e}')

    error_count = len(lt_matches)
    base_score = min(100, int(60 + len(words) * 0.08 + len(long_words) * 0.4))
    grammar_score = max(20, base_score - error_count * 4)

    error_details = []
    for m in lt_matches[:6]:
        ctx = m.get('context', {})
        text_snippet = ctx.get('text', '')
        offset = ctx.get('offset', 0)
        length = ctx.get('length', 0)
        wrong = text_snippet[offset:offset + length] if text_snippet else ''
        replacements = [r['value'] for r in m.get('replacements', [])[:2]]
        error_details.append({
            'wrong': wrong,
            'message': m.get('message', ''),
            'suggestions': replacements,
            'rule': m.get('rule', {}).get('issueType', 'grammar'),
        })

    suggestions = _get_suggestions(text, avg_sent_len, len(long_words), error_details)
    vocab_richness = round(len(set(words)) / max(len(words), 1), 2)

    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "avg_sentence_length": round(avg_sent_len, 1),
        "vocabulary_richness": vocab_richness,
        "grammar_score": grammar_score,
        'error_count': error_count,
        'errors': error_details,
        "suggestions": suggestions,
        "mock": True
    }


def _get_suggestions(text, avg_sent_len, long_word_count, errors):
    suggestions = []
    for e in errors[:3]:
        if e['wrong'] and e['suggestions']:
            suggestions.append(f'Consider replacing "{e["wrong"]}" -> "{e["suggestions"][0]}"')

    if avg_sent_len < 15:
        suggestions.append("Use longer, more complex sentences to demonstrate range")
    if long_word_count < 8:
        suggestions.append("Incorporate more academic vocabulary (e.g. significant, consequently, demonstrate)")
    if "however" not in text.lower() and "furthermore" not in text.lower() and "moreover" not in text.lower():
        suggestions.append("Add cohesive devices: however, furthermore, consequently, in addition")
    if len(text.split('\n')) < 3:
        suggestions.append("Structure your essay with clear paragraph breaks")
    if "in conclusion" not in text.lower() and "to conclude" not in text.lower():
        suggestions.append("Add a clear conclusion paragraph starting with 'In conclusion' or 'To conclude'")
    return suggestions[:6]
