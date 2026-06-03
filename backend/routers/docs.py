from fastapi import APIRouter

from db.store import docs_store

router = APIRouter()


@router.get("/docs")
def get_docs():
    return list(docs_store.values())
