# Currently implemented with only one cursor per connection.
# In the future may implement multiple cursors to enable further multiprocessing 
import sqlite3
import json
from pathlib import Path

DB_PATH = "data/gmailscan.db"


# creates connection do db, returns cursor to that connection
def connect_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    cur = con.cursor()
    return con, cur

# write
def init_db(con, cur):
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

# read only
def is_processed(cur, gmail_id: str) -> bool:
    row = cur.execute("SELECT 1 FROM scanned_emails WHERE gmail_id = ?", (gmail_id,)).fetchone()
    return row is not None

# write
def save_to_db(con, cur, email: dict, has_pii: bool, findings: list):
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

# close
def close_db(con):
    con.close()
