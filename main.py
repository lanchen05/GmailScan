import asyncio

from src.crawler import create_email_queue, fill_email_queue, get_next_email, mark_email_done


async def main():
    queue = create_email_queue(maxsize=100)

    # Pull a small batch first so you can confirm the Gmail API connection works.
    await fill_email_queue(queue, max_results=10)

    print(f"Queued {queue.qsize()} Gmail message objects.")

    while not queue.empty():
        message = await get_next_email(queue)
        print(message)
        mark_email_done(queue)


if __name__ == "__main__":
    asyncio.run(main())
