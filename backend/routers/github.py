import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pydantic import BaseModel

from db.chroma import get_collection
from db.embeddings import embedding_model
from db.store import docs_store, status_events

router = APIRouter()

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
)

GITHUB_API = "https://api.github.com"


class GithubIndexRequest(BaseModel):
    url: str


def parse_repo(url: str) -> tuple[str, str]:
    parts = url.rstrip("/").split("/")
    if len(parts) < 2:
        raise ValueError("올바르지 않은 GitHub URL이에요.")
    return parts[-2], parts[-1]


async def fetch_md_paths(owner: str, repo: str) -> list[str]:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/HEAD",
            params={"recursive": "1"},
            headers={"Accept": "application/vnd.github+json"},
            timeout=30,
        )
        if res.status_code == 404:
            raise HTTPException(status_code=400, detail="레포를 찾을 수 없어요.")
        if res.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub API rate limit에 도달했어요.")
        res.raise_for_status()
        tree = res.json().get("tree", [])
        return [item["path"] for item in tree if item["path"].endswith(".md")]


async def fetch_file_content(owner: str, repo: str, path: str) -> str:
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, timeout=15)
        if res.status_code != 200:
            return ""
        return res.text


async def process_github_repo(doc_id: str, owner: str, repo: str, md_paths: list[str]) -> None:
    try:
        collection = get_collection()
        total = len(md_paths)

        for i, path in enumerate(md_paths):
            content = await fetch_file_content(owner, repo, path)
            if not content.strip():
                continue

            chunks = text_splitter.split_text(content)
            if not chunks:
                continue

            metadatas = [
                {"doc_id": doc_id, "filename": f"{owner}/{repo}", "source": "github", "repo": f"{owner}/{repo}", "path": path, "size": total}
                for _ in chunks
            ]
            embeddings = embedding_model.encode(chunks).tolist()
            collection.add(
                ids=[f"{doc_id}_{path}_{j}" for j in range(len(chunks))],
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
            )

            progress = round((i + 1) / total * 100)
            docs_store[doc_id]["progress"] = progress
            status_events.append({"id": doc_id, "status": "indexing", "progress": progress})

        docs_store[doc_id]["status"] = "ready"
        docs_store[doc_id]["size"] = total
        docs_store[doc_id].pop("progress", None)
        status_events.append({"id": doc_id, "status": "ready", "progress": 100})

    except Exception as e:
        if doc_id in docs_store:
            docs_store[doc_id]["status"] = "error"
            docs_store[doc_id]["errorMessage"] = str(e)
        status_events.append({"id": doc_id, "status": "error", "errorMessage": str(e)})


@router.post("/github")
async def index_github_repo(req: GithubIndexRequest, background_tasks: BackgroundTasks):
    try:
        owner, repo = parse_repo(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    md_paths = await fetch_md_paths(owner, repo)
    if not md_paths:
        raise HTTPException(status_code=400, detail=".md 파일이 없는 레포예요.")

    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "name": f"{owner}/{repo}",
        "size": 0,
        "status": "indexing",
        "uploadedAt": datetime.utcnow().isoformat(),
        "progress": 0,
    }
    docs_store[doc_id] = doc
    status_events.append({"id": doc_id, "status": "indexing", "progress": 0})

    background_tasks.add_task(process_github_repo, doc_id, owner, repo, md_paths)

    return doc
