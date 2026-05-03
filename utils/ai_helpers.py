"""
AI helper functions.
Currently mocked — ready to plug in real APIs.
- Speech-to-text: Replace with Whisper API (free via Hugging Face) or AssemblyAI free tier
- Grammar check: Replace with LanguageTool (open source, free) or GPT-4o
"""

def speech_to_text(audio_url: str) -> dict:
    """
    Mock: Returns a placeholder transcription.
    TO UPGRADE: Use OpenAI Whisper (free via HuggingFace inference API)
    or AssemblyAI free tier (5 hours/month free).
    """
    return {
        "transcript": "[Transcription placeholder — connect Whisper API here]",
        "confidence": 0.0,
        "mock": True
    }

def check_grammar(text: str) -> dict:
    """
    Basic grammar analysis without external API.
    TO UPGRADE: Use LanguageTool REST API (free, self-hostable)
    or integrate OpenAI GPT-4o mini.
    """
    words = text.split()
    sentences = [s for s in text.split('.') if s.strip()]
    long_words = [w for w in words if len(w) > 7]
    avg_sent_len = len(words) / max(len(sentences), 1)

    score = min(100, int(55 + len(words) * 0.1 + len(long_words) * 0.5))

    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "avg_sentence_length": round(avg_sent_len, 1),
        "vocabulary_richness": round(len(set(words)) / max(len(words), 1), 2),
        "grammar_score": score,
        "suggestions": _get_suggestions(text, avg_sent_len, len(long_words)),
        "mock": True
    }

def _get_suggestions(text, avg_sent_len, long_word_count):
    suggestions = []
    if avg_sent_len < 15:
        suggestions.append("Use longer, more complex sentences to demonstrate range")
    if long_word_count < 10:
        suggestions.append("Incorporate more academic vocabulary")
    if "however" not in text.lower() and "furthermore" not in text.lower():
        suggestions.append("Add cohesive devices: however, furthermore, consequently")
    if len(text.split('\n')) < 3:
        suggestions.append("Structure your essay with clear paragraph breaks")
    return suggestions
