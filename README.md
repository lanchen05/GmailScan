# GmailScan

# CURRENT LIMITATIONS:
- Did not test if async thread pool implementation is correct across all files.
- No UI for progress yet, only print statements.
- EXTREMELY SLOW. WAY TOO SLOW WHEN PASSING THROUGH OLLAMA, NEED MUCH MORE OPTIMIZATION
- API connection isn't stable, don't know why.

## Implementation

### Running the project
Requirements:
- python 3.11+
- ollama 3.2. Need to make sure you have a running instance of ollama3.2 on localhost.

To set up environment:
`source .venv/bin/activate`
`pip install -r requirements.txt`

To execute:
`python3 main.py`

You will be prompted to login to your gmail account through your default browser. Once you login, return to the appliation to see the progress of the program. 

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