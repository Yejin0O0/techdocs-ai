import json
import os

import numpy as np
from fastapi import APIRouter
from groq import Groq
from pydantic import BaseModel
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from sse_starlette.sse import EventSourceResponse

from db.chroma import get_collection

router = APIRouter()

embedding_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")


def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY 환경변수가 설정되지 않았어요.")
    return Groq(api_key=api_key)

TOP_K = 5
MODEL = "qwen/qwen3-32b"

SYSTEM_PROMPT = """당신은 기술 문서를 기반으로 답변하는 AI 어시스턴트입니다.
반드시 한국어로만 답변하세요. 중국어, 일본어 등 다른 언어를 절대 사용하지 마세요.

[답변 원칙]
- 제공된 문서 내용을 바탕으로 답변하세요.
- 답변 시 참고한 문서명을 언급하세요. 예: "(API_가이드.pdf 참고)"
- 문서에 해당 내용이 없으면 "제공된 문서에서 관련 내용을 찾을 수 없어요"라고 답변하세요.

[중요 제약사항]
- 문서에서 검색된 내용은 전체 문서의 일부분(청크)입니다. 문서 전체를 보는 것이 아닙니다.
- 따라서 "몇 개 있다", "없다"처럼 개수나 존재 여부를 단정하지 마세요. 대신 "검색된 내용 기준으로는 ~개 확인됩니다" 또는 "검색된 범위에서는 찾을 수 없어요"라고 표현하세요.
- 동의어나 다른 표현(예: CPM 네트워크 = 임계 경로법)도 함께 고려해서 답변하세요.
- 질문자가 특정 문서를 언급하더라도, 검색 결과가 다른 문서에서 나올 수 있습니다. 이 경우 실제 참고한 문서를 정확히 명시하세요."""


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[HistoryMessage] = []


def hybrid_search(question: str, question_vector: list, collection, top_k: int):
    all_data = collection.get(include=["documents", "metadatas"])
    all_chunks = all_data["documents"]
    all_metadatas = all_data["metadatas"]

    if not all_chunks:
        return [], []

    actual_k = min(top_k, len(all_chunks))

    # BM25 키워드 검색
    tokenized = [doc.split() for doc in all_chunks]
    bm25 = BM25Okapi(tokenized)
    bm25_scores = np.array(bm25.get_scores(question.split()), dtype=float)

    # 시맨틱 검색
    sem_results = collection.query(
        query_embeddings=[question_vector],
        n_results=actual_k,
        include=["documents", "distances"],
    )
    sem_scores = np.zeros(len(all_chunks))
    for doc, dist in zip(sem_results["documents"][0], sem_results["distances"][0]):
        for i, chunk in enumerate(all_chunks):
            if chunk == doc:
                sem_scores[i] = max(0.0, 1.0 - dist)
                break

    # 정규화 후 0.5:0.5 결합
    if bm25_scores.max() > 0:
        bm25_scores /= bm25_scores.max()
    if sem_scores.max() > 0:
        sem_scores /= sem_scores.max()

    combined = 0.5 * bm25_scores + 0.5 * sem_scores
    top_indices = np.argsort(combined)[::-1][:actual_k]

    return [all_chunks[i] for i in top_indices], [all_metadatas[i] for i in top_indices]


@router.post("/chat")
async def chat(request: ChatRequest):
    question_vector = embedding_model.encode(request.question).tolist()

    collection = get_collection()
    chunks, metadatas = hybrid_search(request.question, question_vector, collection, TOP_K)

    context = "\n\n".join(chunks)
    sources = list({m["filename"] for m in metadatas if m and "filename" in m})

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": m.role, "content": m.content} for m in request.history],
        {
            "role": "user",
            "content": f"다음 문서 내용을 참고하여 질문에 한국어로 답변해주세요.\n\n[문서 내용]\n{context}\n\n질문: {request.question}",
        },
    ]

    async def event_generator():
        stream = get_groq_client().chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
        )

        buffer = ""
        in_think = False

        for chunk in stream:
            content = chunk.choices[0].delta.content
            if not content:
                continue

            buffer += content

            while True:
                if in_think:
                    end = buffer.find("</think>")
                    if end == -1:
                        buffer = buffer[max(0, len(buffer) - 8):]
                        break
                    buffer = buffer[end + 8:]
                    in_think = False
                else:
                    start = buffer.find("<think>")
                    if start == -1:
                        to_emit = buffer[:-7] if len(buffer) > 7 else ""
                        buffer = buffer[-7:] if len(buffer) > 7 else buffer
                        if to_emit:
                            yield {"event": "message", "data": to_emit}
                        break
                    if start > 0:
                        yield {"event": "message", "data": buffer[:start]}
                    buffer = buffer[start + 7:]
                    in_think = True

        if buffer and not in_think:
            yield {"event": "message", "data": buffer}

        yield {"event": "sources", "data": json.dumps(sources)}

    return EventSourceResponse(event_generator())
