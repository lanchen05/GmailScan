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