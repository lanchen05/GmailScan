# 🛡️ Gmail Ghost Hunter (Local Edition)

A locally-hosted privacy auditor that uses the Gmail API and Local LLMs (Ollama) to find sensitive information (PII) hiding in your inbox.

## 🚀 The Vision
Most people have "Digital Ghosts"—old tax forms, passwords, or bank statements—sitting in their Sent/Inbox folders. This tool finds them using **100% local processing** so your private data never touches the cloud.

---

## 🛠️ Tech Stack
- **Language:** Python 3.10+
- **API:** Google Gmail API (OAuth2)
- **Intelligence:** Ollama (Llama 3.2 / Mistral)
- **Storage:** SQLite (Local persistence)
- **UI:** Streamlit (Real-time monitoring)
- **Concurrency:** Python `asyncio` + `Queue`

---

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
```

## Specific Implementation

### Queue Implementation
Use a asyncio queue. 
API ingestion queue entry should look like this:
[
    {
        "id": "18f29e3a4b5c6d7e",
        "threadId": "18f29e3a4b5c6d7e"
    },
    {
        "id": "18f28f1b2c3d4e5f",
        "threadId": "18f28f1b2c3d4e5f"
    }
]