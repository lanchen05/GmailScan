import asyncio
import time

from src.auth import get_gmail_service
from src.crawler import close_email_queue, create_email_queue, fill_email_queue
from src.models import close_db, connect_db, init_db
from src.processor import process

WORKER_COUNT = 4

async def main():
    con, cur = connect_db()
    init_db(con, cur)
    service = get_gmail_service()
    queue = create_email_queue()
    db_lock = asyncio.Lock()

    try:
        producer_task = asyncio.create_task(fill_email_queue(service, queue))
        worker_tasks = [
            asyncio.create_task(process(con, cur, queue, db_lock))
            for _ in range(WORKER_COUNT)
        ]

        await producer_task
        await close_email_queue(queue, WORKER_COUNT)
        await queue.join()
        await asyncio.gather(*worker_tasks)
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
