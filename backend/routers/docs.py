import asyncio
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from db.store import docs_store, status_events

router = APIRouter()


@router.get("/docs")
def get_docs():
    return list(docs_store.values())


@router.get("/docs/status")
async def docs_status():
    async def event_generator():
        while True:
            if status_events:
                event = status_events.pop(0)
                doc_id = event["id"]
                if doc_id in docs_store:
                    docs_store[doc_id]["status"] = event["status"]
                    if "errorMessage" in event:
                        docs_store[doc_id]["errorMessage"] = event["errorMessage"]
                yield {"data": json.dumps(event)}
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())
