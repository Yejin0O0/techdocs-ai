import json
import os

from fastapi import APIRouter
from groq import Groq
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sse_starlette.sse import EventSourceResponse

from db.chroma import get_collection

router = APIRouter()

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY 환경변수가 설정되지 않았어요.")
    return Groq(api_key=api_key)

TOP_K = 5
MODEL = "llama-3.1-8b-instant"

SYSTEM_PROMPT = """당신은 기술 문서를 기반으로 답변하는 AI 어시스턴트입니다.
주어진 문서 내용만을 바탕으로 답변하세요.
답변 시 어떤 문서를 참고했는지 언급하세요. 예: "(API_가이드.pdf 참고)"
문서에 없는 내용은 "제공된 문서에서 관련 내용을 찾을 수 없어요"라고 답변하세요."""


class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
async def chat(request: ChatRequest):
    question_vector = embedding_model.encode(request.question).tolist()

    collection = get_collection()
    results = collection.query(
        query_embeddings=[question_vector],
        n_results=TOP_K,
        include=["documents", "metadatas"],
    )

    chunks = results["documents"][0]
    metadatas = results["metadatas"][0]

    context = "\n\n".join(chunks)
    sources = list({m["filename"] for m in metadatas if "filename" in m})

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"다음 문서 내용을 참고하여 질문에 답변해주세요.\n\n[문서 내용]\n{context}\n\n질문: {request.question}",
        },
    ]

    async def event_generator():
        stream = get_groq_client().chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield {"event": "message", "data": content}

        yield {"event": "sources", "data": json.dumps(sources)}

    return EventSourceResponse(event_generator())
