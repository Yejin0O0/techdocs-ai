import io
import re
from datetime import datetime

import pdfplumber
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

from db.chroma import get_collection

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".md", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
)

# SSE 이벤트 브로드캐스트용 큐
status_events: list[dict] = []


def make_doc_id(filename: str) -> str:
    return re.sub(r"[^\w\-.]", "_", filename)


def extract_text(filename: str, content: bytes) -> str:
    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    return content.decode("utf-8", errors="ignore")


def process_document(doc_id: str, filename: str, content: bytes) -> None:
    try:
        text = extract_text(filename, content)
        chunks = text_splitter.split_text(text)
        embeddings = embedding_model.encode(chunks).tolist()

        collection = get_collection()
        collection.delete(where={"doc_id": doc_id})
        collection.add(
            ids=[f"{doc_id}_{i}" for i in range(len(chunks))],
            embeddings=embeddings,
            documents=chunks,
            metadatas=[{"doc_id": doc_id, "filename": filename} for _ in chunks],
        )

        status_events.append({"id": doc_id, "status": "ready"})
    except Exception as e:
        status_events.append({"id": doc_id, "status": "error", "errorMessage": str(e)})


@router.post("/upload")
async def upload_document(file: UploadFile, background_tasks: BackgroundTasks):
    filename = file.filename or ""
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식이에요. (.pdf, .md, .txt만 허용)")

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 10MB를 초과했어요.")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="빈 파일은 업로드할 수 없어요.")

    doc_id = make_doc_id(filename)

    background_tasks.add_task(process_document, doc_id, filename, content)

    return {
        "id": doc_id,
        "name": filename,
        "size": len(content),
        "status": "indexing",
        "uploadedAt": datetime.utcnow().isoformat(),
    }
