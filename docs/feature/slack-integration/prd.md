# PRD — Slack 연동

## 1. 개요

Slack 채널에서 TechDocs AI 봇을 멘션하면, 인덱싱된 문서를 기반으로 RAG 답변이 스레드에 달린다. 웹 UI를 열지 않고도 기존 Slack 워크플로우 안에서 문서 질문이 가능하다.

### 왜 이 기능이 필요한가

TechDocs AI의 핵심 가치는 "업무 흐름에서 자연스럽게 문서를 검색하는 것"이다. 웹 UI는 의도적으로 열어야 하지만, Slack은 이미 업무 중 항상 열려 있다. `@TechDocs AI [질문]` 한 줄로 질문할 수 있으면 도구 전환 없이 즉각적인 답변을 받을 수 있다.

---

## 2. 사용자 스토리

| ID    | 역할   | 스토리                                           | 완료 조건                                           |
| ----- | ------ | ------------------------------------------------ | --------------------------------------------------- |
| US-01 | 실무자 | Slack에서 문서 질문을 바로 하고 싶다             | 채널에서 멘션하면 스레드에 RAG 답변이 달린다        |
| US-02 | 실무자 | AI 답변이 어느 문서를 참조했는지 알고 싶다       | 답변 하단에 참조 파일명이 표시된다                  |
| US-03 | 담당자 | Slack 봇 사용 방법을 팀원에게 쉽게 안내하고 싶다 | 웹 UI 사이드바에서 3단계 사용 방법을 확인할 수 있다 |

---

## 3. 기술 결정 (ADR)

### ADR-01: Socket Mode vs Webhook

**Context** — Slack 이벤트를 수신하는 방법으로 Webhook(공개 URL)과 Socket Mode(WebSocket) 중 선택이 필요했다.

Webhook 방식은 Slack이 지정한 공개 URL로 POST 요청을 보내는 구조다. 이 방식은 서버가 인터넷에 공개되어 있어야만 동작한다. 로컬 개발 중에는 ngrok 같은 터널링 도구로 임시 공개 URL을 만들어야 하고, 배포 환경에서는 URL이 변경될 때마다 Slack App 설정을 갱신해야 한다. 즉 Slack 봇을 실행하려면 항상 "어디에 배포되어 있는가"가 전제 조건이 된다.

Socket Mode는 반대로 서버가 Slack 서버에 먼저 WebSocket 연결을 맺고, Slack이 그 연결을 통해 이벤트를 푸시하는 구조다. 서버가 먼저 연결을 시작하기 때문에 공개 URL이 필요 없다.

**Decision** — Socket Mode를 사용한다.

**Alternatives**

- _Webhook_ — 공개 URL이 고정된 프로덕션 환경이라면 Webhook이 더 단순하다. 하지만 이 프로젝트는 로컬 개발과 클라우드 배포(Hugging Face Spaces)를 오가며 반복 테스트하는 포트폴리오 프로젝트다. URL 변경마다 Slack App 설정을 갱신해야 하는 Webhook 방식은 개발 사이클을 느리게 만든다.

**Consequences**

- (+) 로컬 개발 환경에서 ngrok 없이 바로 테스트 가능
- (+) 배포 URL이 바뀌어도 Slack App 설정 변경 불필요
- (+) 서버가 연결을 시작하므로 방화벽/인바운드 포트 개방 불필요
- (-) `SLACK_APP_TOKEN` (xapp-) 추가 발급 필요 — Webhook 대비 토큰이 하나 더 많음
- (-) Socket Mode는 Slack 엔터프라이즈 환경에서 비활성화될 수 있음 (포트폴리오 규모에서는 무관)

---

### ADR-02: 별도 모듈 vs main.py 인라인

**Context** — Slack 봇 로직을 `main.py`에 인라인으로 작성할지 별도 `slack_bot.py`로 분리할지 결정이 필요했다.

**Decision** — `backend/slack_bot.py`로 분리한다.

**Alternatives**

- _main.py 인라인_ — 파일 수가 줄어들지만 lifespan 함수가 비대해지고 Slack 관련 import가 main.py에 집중됨

**Consequences**

- (+) `main.py`는 앱 설정과 라우터 연결만 담당 — 관심사 분리
- (+) `slack_bot.py`를 독립적으로 테스트 가능
- (-) `load_dotenv()`가 `slack_bot.py` import 전에 호출돼야 한다는 순서 제약 발생

---

### ADR-03: `asyncio.create_task()` vs `await`

**Context** — `AsyncSocketModeHandler.connect_async()`는 무한 WebSocket 루프다. FastAPI lifespan에서 실행하는 방법을 결정해야 했다.

**Decision** — `asyncio.create_task()`로 백그라운드에서 실행한다.

**Alternatives**

- _`await handler.connect_async()`_ — lifespan generator가 yield에 도달하지 못해 FastAPI startup이 완료되지 않음

**Consequences**

- (+) lifespan이 정상적으로 yield까지 진행되어 FastAPI 서버 시작 완료
- (+) task 객체를 보관해 shutdown 시 `task.cancel()`로 정리 가능
- (-) `asyncio.sleep(2)`로 연결 확립을 임의 대기 — 연결 상태를 정확히 확인하지 않음
- (-) task 취소 시 graceful shutdown이 아닌 강제 종료

---

### ADR-04: 동기 RAG 코드 실행 — `asyncio.to_thread()`

**Context** — sentence-transformers 임베딩과 Groq SDK는 동기 API다. async 이벤트 핸들러에서 직접 호출하면 이벤트 루프를 블로킹한다.

**Decision** — `asyncio.to_thread(_answer_sync, question)`으로 별도 스레드에서 실행한다.

**Alternatives**

- _직접 `await` 없이 호출_ — 이벤트 루프 블로킹. 답변 생성 중 다른 Slack 이벤트를 처리하지 못함
- _Groq async 클라이언트로 교체_ — LLM 호출은 async로 전환 가능하나, sentence-transformers 임베딩은 여전히 동기라 부분적 해결에 그침

**Consequences**

- (+) 이벤트 루프 블로킹 없이 여러 멘션 동시 처리 가능
- (+) 기존 동기 RAG 함수(`hybrid_search`, `groq_client.chat.completions.create`) 재사용
- (-) 스레드 풀 사용 — GIL로 인해 CPU 바운드 작업(임베딩)의 병렬성은 제한적
- (-) 예외 처리가 스레드 경계를 넘어야 해 디버깅이 다소 복잡

---

## 4. Out of Scope

- DM(Direct Message)으로 질문 (채널 멘션만 지원)
- 답변 스트리밍 (Slack API는 메시지 업데이트 방식 필요 — 구현 복잡도 대비 효용 낮음)
- 토큰 런타임 변경 UI (서버 환경변수로 관리)
- 멀티 워크스페이스 지원

---

## 5. 용어 정의

| 용어        | 정의                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| Socket Mode | Slack이 WebSocket으로 이벤트를 서버에 푸시하는 방식                                       |
| app_mention | 봇이 채널에서 멘션될 때 발생하는 Slack 이벤트 타입                                        |
| thread_ts   | Slack 스레드 타임스탬프. 멘션된 메시지의 ts를 사용하면 해당 메시지의 스레드에 답변이 달림 |
