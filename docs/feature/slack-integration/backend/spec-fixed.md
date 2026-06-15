# Slack 연동 — Backend Spec Fixed

## 기능 개요

Slack Socket Mode로 WebSocket 연결을 유지하며, 채널에서 봇 멘션 시 인덱싱된 문서를 기반으로 RAG 답변을 스레드에 전송한다. FastAPI lifespan 안에서 백그라운드 태스크로 실행된다.

---

## 핵심 동작

- FastAPI 서버 시작 시 Slack WebSocket 연결 자동 수립
- `app_mention` 이벤트 수신 시: 멘션 텍스트 추출 → 검색 중 메시지 전송 → RAG 답변 생성 → 스레드 답변
- 답변에 `📎 출처: filename.pdf` 형식으로 참조 문서명 첨부
- 환경변수 누락 시 봇 없이 서버만 정상 실행 (graceful degradation)

---

## 처리 파이프라인

```
Slack 채널: @TechDocs AI [질문]
    ↓
app_mention 이벤트 수신 (WebSocket)
    ↓
멘션 텍스트에서 질문 추출 (re.sub으로 <@USER_ID> 제거)
    ↓
"잠깐만요, 문서를 검색하고 있어요... 🔍" 스레드 전송
    ↓
asyncio.to_thread(_answer_sync, question)
    ├── embedding_model.encode(question)
    ├── hybrid_search(question, vector, collection, TOP_K)
    └── groq_client.chat.completions.create(model, messages, stream=False)
    ↓
답변 + 출처 스레드 전송
```

---

## 모듈 구조

### `backend/slack_bot.py`

- `_build_app()` — 모듈 레벨에서 `AsyncApp` 초기화 (토큰 없으면 `None`)
- `_extract_question(text)` — 멘션 태그 제거 후 질문 텍스트 반환
- `_answer_sync(question)` — 동기 RAG 답변 생성 (임베딩 + 검색 + LLM)
- `start_slack_bot()` — 이벤트 핸들러 등록 + WebSocket 연결 시작, `(handler, task)` 반환

### `backend/main.py` 통합

```python
from dotenv import load_dotenv
load_dotenv()  # 모든 로컬 import 전에 실행

from slack_bot import start_slack_bot

@asynccontextmanager
async def lifespan(app):
    ...
    slack_result = await start_slack_bot()
    yield
    if slack_result:
        handler, task = slack_result
        await handler.close_async()
        task.cancel()
```

---

## 비동기 처리

| 문제                                    | 해결                                        |
| --------------------------------------- | ------------------------------------------- |
| `connect_async()`는 무한 WebSocket 루프 | `asyncio.create_task()`로 백그라운드 분리   |
| 임베딩/Groq SDK가 동기 API              | `asyncio.to_thread(_answer_sync, question)` |
| 모듈 레벨에서 env 접근                  | `load_dotenv()`를 import 전에 호출          |

---

## 환경변수

| 변수              | 설명                                   |
| ----------------- | -------------------------------------- |
| `SLACK_BOT_TOKEN` | `xoxb-...` 형식, Bot OAuth Token       |
| `SLACK_APP_TOKEN` | `xapp-...` 형식, Socket Mode App Token |

두 변수 중 하나라도 없으면 봇 시작 없이 서버만 정상 실행.

---

## 엣지 케이스

| 상황                  | 처리                                                      |
| --------------------- | --------------------------------------------------------- |
| 멘션만 하고 질문 없음 | "질문을 입력해주세요. 예: `@TechDocs AI FastAPI란?`" 안내 |
| 관련 문서 없음        | "제공된 문서에서 관련 내용을 찾을 수 없어요."             |
| 토큰 누락             | 경고 로그 후 봇 없이 서버 정상 실행                       |
