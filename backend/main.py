from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.chroma import get_collection
from db.store import docs_store
from routers import chat, docs, upload

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    collection = get_collection()
    result = collection.get(include=["metadatas"])
    seen = set()
    for metadata in result["metadatas"]:
        doc_id = metadata.get("doc_id")
        if doc_id and doc_id not in seen:
            seen.add(doc_id)
            docs_store[doc_id] = {
                "id": doc_id,
                "name": metadata.get("filename", doc_id),
                "size": metadata.get("size", 0),
                "status": "ready",
            }
    yield


app = FastAPI(title="TechDocs AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(docs.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
