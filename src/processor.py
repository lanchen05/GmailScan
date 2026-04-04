import asyncio
import json
import ollama
from models import init_db, save_to_db


async def process(queue: asyncio.Queue):
    while True:
        emailID: dict = await queue.get()
        # call gmail api to get the exact email for this id
        # TODO: implement the logic to parse emailid, get specific email message for this
        email = emailID
        try:
            _handle_email(email)
        finally:
            queue.task_done()


def _handle_email(email: dict):
    response = ollama.chat(
        model="llama3.2",
        messages=[{"role": "user", "content": _build_prompt(email)}]
    )
    result = json.loads(response["message"]["content"])
    save_to_db(email, result["has_pii"], result["findings"])


def _build_prompt(email: dict) -> str:
    return f"""You are a PII detector. Analyze the email below for actual sensitive data values.

            Only flag if the email contains a real, specific value such as:
            - An actual SSN (e.g. 123-45-6789)
            - An actual credit card number (e.g. 4111 1111 1111 1111)
            - An actual password or secret key written out
            - An actual bank account or routing number
            - An actual tax ID or EIN

            Do NOT flag emails that merely mention the words "SSN", "password", "credit card", etc. without including the real value.

            Return JSON only:
            {{
            "has_pii": true/false,
            "findings": [
                {{"type": "SSN|credit_card|password|bank_account|tax_id|other", "value": "...", "context": "..."}}
            ]
            }}

            Subject: {email.get('subject', '')}
            Body: {email.get('body', '')}"""

# TODO: delete these tests later.

def main():
    init_db()

    # Test 1: email with actual PII — should flag
    pii_email = {
        "id": "test001",
        "date": "2026-04-03T12:00:00Z",
        "from": "bank@example.com",
        "subject": "Your account details",
        "body": "Your SSN on file is 123-45-6789 and your routing number is 021000021.",
        "has_attachments": False
    }

    # Test 2: email that mentions PII words but has no real values — should NOT flag
    no_pii_email = {
        "id": "test002",
        "date": "2026-04-03T12:00:00Z",
        "from": "hr@company.com",
        "subject": "Reminder",
        "body": "Please do not send your SSN or credit card number over email.",
        "has_attachments": False
    }

    # Test 3: completely clean email — should NOT flag
    clean_email = {
        "id": "test003",
        "date": "2026-04-03T12:00:00Z",
        "from": "friend@gmail.com",
        "subject": "Lunch tomorrow?",
        "body": "Hey, are you free for lunch tomorrow at noon?",
        "has_attachments": False
    }

    testing4 = {
        "id": "test004",
        "date": "2026-04-03T12:00:00Z",
        "from": "hr@company.com",
        "subject": "Reminder",
        "body": "Please do not send your Social Security Number or credit card number over email.",
        "has_attachments": False
    }

    for email in [testing4]:
        print(f"\nTesting: {email['subject']}")
        _handle_email(email)
        print("Done.")


if __name__ == '__main__':
    main()
