import asyncio
# from src.crawler import crawl
from src.processor import process


async def main():
    queue = asyncio.Queue()

    await asyncio.gather(
        # crawl(queue),
        process(queue)
    )


if __name__ == "__main__":
    asyncio.run(main())
