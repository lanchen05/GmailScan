import asyncio
import time
from src.auth import get_gmail_service
from src.crawler import fill_email_queue
from src.processor import process
from src.models import connect_db, init_db, close_db

# initialize db connection here
# initialize api connection here

async def main():
    print('Starting GmailScan')
    connection, cursor = connect_db()
    try:
        queue = asyncio.Queue()
        service = get_gmail_service() # Blocking call, make async in future. 

        init_db(connection, cursor)

        await asyncio.gather(
            fill_email_queue(service, queue),
            process(connection, cursor, queue)
        )
    except KeyboardInterrupt:
        print("Shutting down.")
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        print('Ending GmailScan')
        close_db(connection)



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
