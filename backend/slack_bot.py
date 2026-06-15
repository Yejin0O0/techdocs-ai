import asyncio
import logging
import os
import re

from slack_bolt.async_app import AsyncApp
from slack_bolt.adapter.socket_mode.async_handler import AsyncSocketModeHandler

logger = logging.getLogger(__name__)

from db.chroma import get_collection
from db.embeddings import embedding_model
from routers.chat import MODEL, SYSTEM_PROMPT, TOP_K, get_groq_client, hybrid_search


def _build_app() -> AsyncApp | None:
    bot_token = os.getenv("SLACK_BOT_TOKEN")
    if not bot_token:
        return None
    return AsyncApp(token=bot_token)


app = _build_app()


def _extract_question(text: str) -> str:
    return re.sub(r"<@[A-Z0-9]+>", "", text).strip()


def _answer_sync(question: str) -> str:
    question_vector = embedding_model.encode(question).tolist()
    collection = get_collection()
    chunks, metadatas = hybrid_search(question, question_vector, collection, TOP_K)

    if not chunks:
        return "제공된 문서에서 관련 내용을 찾을 수 없어요."

    context = "\n\n".join(
        f"[출처: {m.get('filename', '알 수 없음')}]\n{chunk}"
        for chunk, m in zip(chunks, metadatas)
    )
    sources = list({m.get("filename") for m in metadatas[:3] if m.get("filename")})

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"다음 문서 내용을 참고하여 질문에 한국어로 답변해주세요.\n\n[문서 내용]\n{context}\n\n질문: {question}",
        },
    ]

    response = get_groq_client().chat.completions.create(
        model=MODEL, messages=messages, stream=False
    )
    answer = response.choices[0].message.content or "답변을 생성하지 못했어요."

    if sources:
        answer += f"\n\n📎 출처: {', '.join(sources)}"
    return answer


async def start_slack_bot() -> tuple[AsyncSocketModeHandler, asyncio.Task] | None:
    app_token = os.getenv("SLACK_APP_TOKEN")
    if not app or not app_token:
        logger.warning("Slack 토큰이 없어 봇을 시작하지 않습니다.")
        return None

    @app.event("app_mention")
    async def handle_mention(event, say):
        question = _extract_question(event.get("text", ""))
        if not question:
            await say(
                "질문을 입력해주세요. 예: `@TechDocs AI FastAPI란?`",
                thread_ts=event.get("ts"),
            )
            return

        await say("잠깐만요, 문서를 검색하고 있어요... 🔍", thread_ts=event.get("ts"))
        answer = await asyncio.to_thread(_answer_sync, question)
        await say(answer, thread_ts=event.get("ts"))

    handler = AsyncSocketModeHandler(app, app_token)
    task = asyncio.create_task(handler.connect_async())
    await asyncio.sleep(2)
    logger.info("Slack 봇 연결됨 (Socket Mode)")
    return handler, task
