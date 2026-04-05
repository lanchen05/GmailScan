import asyncio

QUEUE_BUFFER = 500   # max IDs held in memory at once (blocks crawler when full)
MAX_QUEUE = 10000    # max IDs crawled in total across all pages


def create_email_queue() -> asyncio.Queue:
    return asyncio.Queue(maxsize=QUEUE_BUFFER)


def list_message_ids(service, user_id: str = "me", page_token: str | None = None) -> dict:
    return (
        service.users().messages().list(userId=user_id, maxResults=100, pageToken=page_token).execute()
    )


async def fill_email_queue(service, queue: asyncio.Queue, user_id: str = "me", max_results: int = MAX_QUEUE):
    next_page_token = None
    queued_count = 0

    while True:
        # list message ids
        response = await asyncio.to_thread(list_message_ids, service, user_id, next_page_token)
        messages = response.get("messages", [])

        if not messages:
            break

        for message in messages:
            if max_results is not None and queued_count >= max_results:
                return

            if "id" not in message:
                continue

            await queue.put({"id": message["id"], "threadId": message.get("threadId", "")})
            queued_count += 1

        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break

async def close_email_queue(queue: asyncio.Queue, worker_count: int):
    """
    Push one sentinel per processor worker so each consumer can exit cleanly.
    """
    for _ in range(worker_count):
        await queue.put(None)
