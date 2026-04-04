
#Async utilizes processor concurrency to allow for it run even when
#there is nothing inside of the queue
import asyncio

class AsyncEmailQueue:
    
    #Creates the queue of emails itself
    def __init__(self):
        self.queue = asyncio.Queue()
        self.seen = set()  # optional: prevent duplicates

    #Adds email ids into the queue
    async def enqueue(self, email_id):
        if email_id not in self.seen:
            await self.queue.put(email_id)
            self.seen.add(email_id)

    #Onces the queue has been processed, it will be dequeue
    #or taken out of the queue so that it wont be run through again
    async def dequeue(self):
        if self.queue.empty():
            return None
        email_id = await self.queue.get()
        return email_id

    def size(self):
        return self.queue.qsize()