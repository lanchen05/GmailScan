# GmailScan

A privacy audit tool that scans your Gmail inbox for Personally Identifiable Information (PII) using a local LLM, with a real-time Next.js web dashboard to review results. Everything runs locally — no data is sent to external cloud services.

## How It Works

GmailScan uses a two-stage pipeline to detect PII efficiently:

**Stage 1 — Pre-screener (fast):** Each email is scanned with regex patterns and keyword phrases for known PII formats (SSNs, credit card numbers, EINs, inline credentials, etc.). Emails that show no signal are marked clean immediately — no LLM call made.

**Stage 2 — LLM analysis (selective):** Only emails flagged as suspicious by Stage 1 are sent to a local Ollama LLM for final confirmation. The LLM distinguishes between emails that merely mention PII terms versus emails that contain actual sensitive values.

Confirmed PII hits are saved to a local SQLite database, automatically labeled `GmailScan` in Gmail, and displayed in the live dashboard.

## Features

- Two-stage PII detection (regex pre-screen + LLM confirmation)
- Parallel processing with 4 async workers
- Gmail label `GmailScan` automatically applied to flagged emails
- Next.js dashboard at `http://localhost:3000` with real-time polling
- Per-email performance metrics (fetch time, LLM time, total time) with latency chart
- Bounded queue with backpressure (500 in-memory, up to 10,000 total)
- Idempotent processing — re-runs skip already-scanned emails

## PII Detected

| Type | Example |
| --- | --- |
| SSN | `123-45-6789` |
| Credit card | `4111 1111 1111 1111` |
| EIN / Tax ID | `12-3456789` |
| Inline credentials | `password: abc123`, `api_key = XYZ` |
| Bank / routing numbers | keyword-matched, LLM confirmed |

## Project Structure

```text
GmailScan/
├── main.py                # Entry point — orchestrates crawler and workers
├── requirements.txt       # Python dependencies
├── credentials.json       # Google OAuth2 credentials (not committed)
├── token.json             # Cached auth token (not committed)
├── data/
│   ├── gmailscan.db       # SQLite results database
│   └── scan_status.json   # Scan state (idle / running / done)
├── src/
│   ├── auth.py            # Google OAuth2 flow (gmail.modify scope)
│   ├── auth_cli.py        # Minimal OAuth trigger for the web UI
│   ├── crawler.py         # Gmail API producer — paginates and fills queue
│   ├── prescreener.py     # Stage 1: regex + keyword fast filter
│   ├── processor.py       # Stage 2: fetch email, run LLM, save + label
│   ├── models.py          # SQLite schema and read/write helpers
│   └── labeler.py         # Gmail label management (create or reuse)
└── web/                   # Next.js 16 frontend (TypeScript + Tailwind CSS v4)
    ├── app/
    │   ├── page.tsx           # Home — auth status + scan trigger
    │   ├── dashboard/
    │   │   └── page.tsx       # PII Review Board — metrics, table, charts
    │   └── api/
    │       ├── auth/login/    # POST — spawns auth_cli.py subprocess
    │       ├── auth/status/   # GET  — checks token.json validity
    │       ├── run/           # POST — spawns main.py as detached process
    │       ├── scan-status/   # GET  — reads scan_status.json
    │       └── emails/        # GET  — queries SQLite, returns dashboard JSON
    ├── components/            # MetricsGrid, EmailTable, LatencyChart, RiskQueue, …
    └── lib/
        └── types.ts           # Shared TypeScript interfaces
```

## Setup

### Requirements

- Python 3.11+
- Node.js 18+
- Ollama with `llama3.2` or `llama3.2:1b`
- A Google Cloud project with the Gmail API enabled and OAuth2 credentials

### 1. Python dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend dependencies

```bash
cd web
npm install
```

### 3. Set up Ollama

```bash
brew install ollama          # install Ollama if not already present
ollama serve                 # start the Ollama server
ollama pull llama3.2:1b      # download the model (faster, recommended)
```

### 4. Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the **Gmail API**
3. Create OAuth2 credentials (Desktop app) and download as `credentials.json`
4. Place `credentials.json` in the project root

### 5. Run

Start the Next.js frontend:

```bash
cd web
npm run dev
```

Open `http://localhost:3000`, click **Connect Gmail** to authorize, then click **Run Scan** to start processing. The dashboard at `/dashboard` updates live as emails are scanned.

> On subsequent runs the cached `token.json` is reused automatically, and already-scanned emails are skipped.

## Performance

| Version | Approach |
| --- | --- |
| v0.5 | LLM called on every email (~33s/email) |
| v1.0 | Pre-screen filter + selective LLM |
| v1.1 | Full-speed async pipeline with 4 workers |

Tunable constants in `src/crawler.py`:

| Constant | Default | Purpose |
| --- | --- | --- |
| `QUEUE_BUFFER` | 500 | Max IDs held in memory at once |
| `MAX_QUEUE` | 10,000 | Total emails crawled per run |

Tunable constants in `src/processor.py` and `main.py`:

| Constant | Default | Purpose |
| --- | --- | --- |
| `_BODY_CHAR_LIMIT` | 2,000 | Max characters sent to LLM |
| `num_predict` | 150 | Max tokens in LLM response |
| `WORKER_COUNT` | 4 | Parallel processing workers |

## Known Limitations

- Only scans Primary inbox (highest PII probability, intentional)
- LLM inference on CPU is the main throughput bottleneck
- Plain text only — HTML-only emails are not parsed, as well as any attachments
