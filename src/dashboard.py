import json
import sqlite3
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "gmailscan.db"
WEB_DIR = Path(__file__).resolve().parent.parent / "web"


def _parse_findings(raw_value) -> list[dict]:
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def load_dashboard_payload() -> dict:
    if not DB_PATH.exists():
        return {
            "summary": {
                "totalScanned": 0,
                "piiHits": 0,
                "cleanEmails": 0,
                "totalFindings": 0,
            },
            "emails": [],
        }

    with sqlite3.connect(DB_PATH) as con:
        rows = con.execute(
            """
            SELECT gmail_id, date, sender, subject, has_pii, findings, processed_at
            FROM scanned_emails
            ORDER BY processed_at DESC
            """
        ).fetchall()

    emails = []
    pii_hits = 0
    total_findings = 0

    for gmail_id, date, sender, subject, has_pii, findings, processed_at in rows:
        parsed_findings = _parse_findings(findings)
        finding_count = len(parsed_findings)
        pii_flag = bool(has_pii)
        pii_hits += 1 if pii_flag else 0
        total_findings += finding_count

        emails.append(
            {
                "gmailId": gmail_id,
                "date": date or "",
                "sender": sender or "",
                "subject": subject or "",
                "hasPii": pii_flag,
                "findings": parsed_findings,
                "findingCount": finding_count,
                "processedAt": processed_at or "",
            }
        )

    return {
        "summary": {
            "totalScanned": len(emails),
            "piiHits": pii_hits,
            "cleanEmails": len(emails) - pii_hits,
            "totalFindings": total_findings,
        },
        "emails": emails,
    }


class DashboardHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/emails":
            payload = load_dashboard_payload()
            data = json.dumps(payload).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/":
            self.path = "/index.html"

        return super().do_GET()

    def log_message(self, format, *args):
        return


def run_dashboard_server(host: str = "127.0.0.1", port: int = 8501):
    handler = partial(DashboardHandler, directory=str(WEB_DIR))
    server = ThreadingHTTPServer((host, port), handler)
    print(f"GmailScan dashboard running at http://{host}:{port}")
    server.serve_forever()

