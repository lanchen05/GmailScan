import asyncio
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from src.auth import get_gmail_service
from src.crawler import close_email_queue, create_email_queue, fill_email_queue
from src.models import close_db, connect_db, init_db
from src.processor import process
from src.labeler import get_or_create_label

WORKER_COUNT = 4
SCAN_STATUS_PATH = Path("data/scan_status.json")


def _write_scan_status(status: str, started_at: str | None = None, finished_at: str | None = None):
    SCAN_STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {"status": status, "startedAt": started_at, "finishedAt": finished_at}
    tmp = SCAN_STATUS_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload))
    os.replace(tmp, SCAN_STATUS_PATH)


async def main():
    con, cur = connect_db()
    init_db(con, cur)
    service = get_gmail_service()
    label_id = get_or_create_label(service)
    queue = create_email_queue()
    db_lock = asyncio.Lock()

    started_at = datetime.now(timezone.utc).isoformat()
    _write_scan_status("running", started_at=started_at)

    try:
        producer_task = asyncio.create_task(fill_email_queue(service, queue))
        worker_tasks = [
            asyncio.create_task(process(con, cur, queue, db_lock, label_id))
            for _ in range(WORKER_COUNT)
        ]

        await producer_task
        await close_email_queue(queue, WORKER_COUNT)
        await queue.join()
        await asyncio.gather(*worker_tasks)

        _write_scan_status("done", started_at=started_at, finished_at=datetime.now(timezone.utc).isoformat())
        print("Processing complete. Open http://localhost:3000 to view results.")
    finally:
        close_db(con)


if __name__ == "__main__":
    for attempt in range(3):
        try:
            asyncio.run(main())
            break
        except Exception as e:
            if "SSL" in str(e) and attempt < 2:
                print(f"SSL error, retrying... ({attempt + 1}/3)")
                time.sleep(2)
            else:
                raise
