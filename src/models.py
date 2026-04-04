import sqlite3
import json


DB_PATH = "data/gmailscan.db"


def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS scanned_emails (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            gmail_id      TEXT UNIQUE NOT NULL,
            date          TEXT,
            sender        TEXT,
            subject       TEXT,
            has_pii       INTEGER NOT NULL DEFAULT 0,
            findings      TEXT,
            processed_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    con.commit()
    con.close()


def save_to_db(email: dict, has_pii: bool, findings: list):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""
        INSERT OR IGNORE INTO scanned_emails (gmail_id, date, sender, subject, has_pii, findings)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        email.get("id"),
        email.get("date"),
        email.get("from"),
        email.get("subject"),
        1 if has_pii else 0,
        json.dumps(findings)
    ))
    con.commit()
    con.close()
