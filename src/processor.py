import asyncio
import base64
import json
import threading
import time
import ollama
from src.models import is_processed, save_to_db
from src.auth import get_gmail_service
from src.prescreener import prescreen
from src.labeler import apply_label

_THREAD_LOCAL = threading.local()


def _get_thread_service():
    service = getattr(_THREAD_LOCAL, "gmail_service", None)
    if service is None:
        service = get_gmail_service()
        _THREAD_LOCAL.gmail_service = service
    return service


async def process(con, cur, queue: asyncio.Queue, db_lock: asyncio.Lock, label_id: str | None = None):
    while True:
        item: dict = await queue.get()
        if item is None:  # sentinel — crawler is done
            queue.task_done()
            break
        try:
            async with db_lock:
                if is_processed(cur, item.get("id")):
                    continue

            total_start = time.perf_counter()

            fetch_start = time.perf_counter()
            email = await asyncio.to_thread(fetch_email, item["id"])
            fetch_ms = round((time.perf_counter() - fetch_start) * 1000)

            suspicious, hints = prescreen(email)

            if not suspicious:
                result = {"has_pii": False, "findings": []}
                llm_ms = None
                total_ms = round((time.perf_counter() - total_start) * 1000)
                print(f'Prescreened clean: {email.get("id")} (fetch={fetch_ms}ms, total={total_ms}ms)')
            else:
                llm_start = time.perf_counter()
                result = await asyncio.to_thread(analyze_email, email)
                llm_ms = round((time.perf_counter() - llm_start) * 1000)
                total_ms = round((time.perf_counter() - total_start) * 1000)
                print(f'LLM analyzed: {email.get("id")} hints={hints} '
                      f'(fetch={fetch_ms}ms, llm={llm_ms}ms, total={total_ms}ms)')

            async with db_lock:
                save_to_db(con, cur, email, result["has_pii"], result["findings"],
                           fetch_ms=fetch_ms, llm_ms=llm_ms, total_ms=total_ms)

            if result["has_pii"] and label_id:
                await asyncio.to_thread(
                    apply_label, _get_thread_service(), email["id"], label_id
                )
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


_BODY_CHAR_LIMIT = 2000

def analyze_email(email: dict) -> dict:
    response = ollama.chat(
        model="llama3.2",
        messages=[{"role": "user", "content": _build_prompt(email)}],
        options={"temperature": 0, "num_predict": 150},
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
            Body: {email.get('body', '')[:_BODY_CHAR_LIMIT]}"""
