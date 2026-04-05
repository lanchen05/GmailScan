import asyncio
import base64
import json
import threading
import ollama
from src.models import is_processed, save_to_db
from src.auth import get_gmail_service

_THREAD_LOCAL = threading.local()


def _get_thread_service():
    service = getattr(_THREAD_LOCAL, "gmail_service", None)
    if service is None:
        service = get_gmail_service()
        _THREAD_LOCAL.gmail_service = service
    return service


async def process(con, cur, queue: asyncio.Queue, db_lock: asyncio.Lock):
    while True:
        item: dict = await queue.get()
        if item is None:  # sentinel — crawler is done
            queue.task_done()
            break
        try:
            async with db_lock:
                if is_processed(cur, item.get("id")):
                    continue

            email = await asyncio.to_thread(fetch_email, item["id"])
            result = await asyncio.to_thread(analyze_email, email)

            async with db_lock:
                save_to_db(con, cur, email, result["has_pii"], result["findings"])
            print(f'Processed message id: {email.get("id")}')
        finally:
            queue.task_done()


def fetch_email(message_id: str, user_id: str = "me") -> dict:
    service = _get_thread_service()
    msg = service.users().messages().get(userId=user_id, id=message_id, format="full").execute()

    headers = {h["name"].lower(): h["value"] for h in msg.get("payload", {}).get("headers", [])}

    body = ""
    payload = msg.get("payload", {})
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data", "")
                body = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")
                break
    else:
        data = payload.get("body", {}).get("data", "")
        if data:
            body = base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")

    return {
        "id": message_id,
        "threadId": msg.get("threadId", ""),
        "from": headers.get("from", ""),
        "subject": headers.get("subject", ""),
        "date": headers.get("date", ""),
        "body": body,
        "has_attachments": any(part.get("filename") for part in payload.get("parts", [])),
    }


def analyze_email(email: dict) -> dict:
    response = ollama.chat(
        model="llama3.2",
        messages=[{"role": "user", "content": _build_prompt(email)}]
    )
    try:
        return json.loads(response["message"]["content"])
    except json.JSONDecodeError:
        print(f'Skipping {email.get("id")} — Ollama returned invalid JSON')
        return {"has_pii": False, "findings": []}


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
