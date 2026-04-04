# GmailScan

## 📂 Project Structure
```text
gmail-ghost-hunter/
├── data/               # SQLite DB
├── src/
│   ├── auth.py         # Google OAuth2 Flow
│   ├── crawler.py      # Gmail API Ingestion -> Queue
│   ├── processor.py    # Queue -> Ollama -> SQLite
│   ├── models.py       # DB Schema
│   └── dashboard.py    # Streamlit UI
├── requirements.txt
└── main.py             # App Entry Point

## Specific Implementation

### Queue Implementation
Use a asyncio queue. 
API ingestion queue entry should look like this:
{
    "id": "18f29e3a4b5c6d7e",          # Gmail unique ID
    "threadId": "18f29e3a4b5c6d7e",    # Thread ID
    "from": "bank@example.com",        # Cleaned sender address
    "subject": "Your Monthly Statement",
    "date": "2026-04-03T12:00:00Z",    # ISO format timestamp
    "body": "Your account ending in 1234 has a new statement...", # Plain text
    "has_attachments": True            # Boolean flag
}