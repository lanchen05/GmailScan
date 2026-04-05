"""
Stage 1 pre-filter: fast regex + keyword scan.

Returns suspicious=True only when a pattern or phrase strongly suggests
an actual PII value is present — not just that PII is mentioned.
Keeps false negatives near zero while skipping the LLM for clearly
clean emails.
"""
import re

# ---------------------------------------------------------------------------
# Regex patterns — match specific numeric / credential formats
# ---------------------------------------------------------------------------
_PATTERNS: list[tuple[str, re.Pattern]] = [
    # SSN:  123-45-6789  or  123 45 6789
    ("SSN",
     re.compile(r'\b\d{3}[- ]\d{2}[- ]\d{4}\b')),

    # Generic 16-digit credit card (grouped): 4111 1111 1111 1111
    ("credit_card",
     re.compile(r'\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b')),

    # EIN / Tax ID:  12-3456789
    ("EIN",
     re.compile(r'\b\d{2}-\d{7}\b')),

    # Credential written inline:  password: abc123  /  api_key = abcXYZ...
    ("credential_assignment",
     re.compile(
         r'(?:password|passwd|pwd|secret|api[_\s]?key|auth[_\s]?token|private[_\s]?key)'
         r'\s*[:=]\s*\S{6,}',
         re.IGNORECASE,
     )),
]

# ---------------------------------------------------------------------------
# Keywords — specific phrases unlikely to appear without a real value nearby
# ---------------------------------------------------------------------------
_KEYWORDS: list[str] = [
    "social security number",
    "social security #",
    "social security",
    "bank account number",
    "routing number",
    "account number",
    "credit card number",
    "card number",
    "tax id",
    "taxpayer id",
    "ssn",
]


def prescreen(email: dict) -> tuple[bool, list[str]]:
    """
    Stage 1 fast filter.

    Returns:
        (suspicious, hints) where hints is a list of matched rule names
        (useful for debugging / logging).
    """
    text = f"{email.get('subject', '')} {email.get('body', '')}"
    text_lower = text.lower()
    hints: list[str] = []

    for name, pattern in _PATTERNS:
        if pattern.search(text):
            hints.append(f"pattern:{name}")

    for keyword in _KEYWORDS:
        if keyword in text_lower:
            hints.append(f"keyword:{keyword}")

    return bool(hints), hints
