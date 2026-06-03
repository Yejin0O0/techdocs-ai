import asyncio
import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from db.chroma import get_collection
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


@router.delete("/docs/{doc_id}")
def delete_doc(doc_id: str):
    if doc_id not in docs_store:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없어요.")

    get_collection().delete(where={"doc_id": doc_id})
    del docs_store[doc_id]

    return {"id": doc_id, "status": "deleted"}
