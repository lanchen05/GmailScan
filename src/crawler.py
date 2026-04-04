import asyncio

try:
    from auth import get_gmail_service
except ImportError:
    from src.auth import get_gmail_service

def create_email_queue(maxsize: int = 100) -> asyncio.Queue:
    #Create the shared asyncio queue that holds raw Gmail message objects.
    return asyncio.Queue(maxsize=maxsize)

def list_message_ids(service, user_id: str = "me", page_token: str | None = None) -> dict:
    #Fetch one page of Gmail message IDs from users.messages.list().
    #users.messages.list() is from the gmailAPI
    return (
        service.users().messages().list(userId=user_id, maxResults=100, pageToken=page_token).execute()
    )

async def fill_email_queue(queue: asyncio.Queue,user_id: str = "me",max_results: int | None = None,):
    service = get_gmail_service()
    next_page_token = None
    queued_count = 0

    while True:
        response = list_message_ids(service, user_id=user_id, page_token=next_page_token)
        messages = response.get("messages", [])

        if not messages:
            break

        for message in messages:
            if max_results is not None and queued_count >= max_results:
                return

            if "id" not in message:
                continue

            await queue.put(
                {
                    "id": message["id"],
                    "threadId": message.get("threadId", ""),
                }
            )
            queued_count += 1

        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break

async def get_next_email(queue: asyncio.Queue) -> dict:
    #Remove and return the next raw Gmail message object from the queue.
    return await queue.get()


def mark_email_done(queue: asyncio.Queue):
    #Mark a dequeued queue item as fully processed.
    queue.task_done()
