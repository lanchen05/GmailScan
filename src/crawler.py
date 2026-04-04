import asyncio
MAX_QUEUE = 500

def list_message_ids(service, user_id: str = "me", page_token: str | None = None) -> dict:
    return (
        service.users().messages().list(userId=user_id, maxResults=100, pageToken=page_token).execute()
    )


async def fill_email_queue(service, queue: asyncio.Queue, user_id: str = "me", max_results: int = MAX_QUEUE):
    loop = asyncio.get_event_loop()
    next_page_token = None
    queued_count = 0

    while True:
        # list message ids
        response = await loop.run_in_executor(None, list_message_ids, service, user_id, next_page_token)
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

    await queue.put(None)  # sentinel to signal processor to stop
