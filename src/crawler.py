import asyncio
from auth import get_gmail_service

async def fetch_emails(queue: asyncio.Queue, service, user_id='me', max_results=1000):
    """
    Fetch email IDs from Gmail in batches and put them in the queue.
    """
    next_page_token = None
    total_fetched = 0
    seen = set()  # prevent duplicates

    while True:
        response = service.users().messages().list(
            userId=user_id,
            maxResults=100,
            pageToken=next_page_token
        ).execute()

        messages = response.get('messages', [])

        for msg in messages:
            email_id = msg['id']
            if email_id not in seen:
                await queue.put(email_id)  # directly put into the asyncio queue
                seen.add(email_id)
                total_fetched += 1
                if total_fetched >= max_results:
                    print(f"[Fetcher] Reached max_results: {max_results}")
                    return

        next_page_token = response.get('nextPageToken')
        if not next_page_token or total_fetched >= max_results:
            print(f"[Fetcher] Fetched total emails: {total_fetched}")
            break

        await asyncio.sleep(0.1)  # small delay to avoid rate limits

async def process_emails(queue: asyncio.Queue):
    """
    Dequeue email IDs and process them.
    """
    while True:
        if queue.empty():
            await asyncio.sleep(0.1)
            continue

        email_id = await queue.get()  # take email ID from the queue
        print(f"[Processor] Processing email ID: {email_id}")
        await asyncio.sleep(0.2)  # simulate processing

async def run_crawler(max_emails=50):
    service = get_gmail_service()
    queue = asyncio.Queue()  # create queue object

    await asyncio.gather(
        fetch_emails(queue, service, max_results=max_emails),
        process_emails(queue)
    )

if __name__ == "__main__":
    asyncio.run(run_crawler())