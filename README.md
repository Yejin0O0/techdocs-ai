# TechDocs AI

> 기술 문서를 업로드하면 AI가 출처와 함께 답변하는 한국어 RAG 챗봇

<!-- TODO: 데모 GIF (업로드 → 질문 → 스트리밍 답변 → 출처 패널) -->
<!-- ![demo](./docs/assets/demo.gif) -->

<!-- TODO: 배포 URL -->
<!-- 🔗 [라이브 데모](https://<vercel-url>.vercel.app) -->

- 개발 기간: 2026.06.01 ~ 2026.06.16
- 개발 인원: 1인 (기획, 프론트엔드, 백엔드, 배포)

---

## 주요 기능

- **문서 업로드**: PDF, MD, TXT Drag & Drop, 자동 청킹 및 벡터 인덱싱, 진행률 실시간 표시(SSE)
- **AI 채팅**: SSE 스트리밍 답변, 마크다운 및 코드 블록 Syntax Highlighting
- **출처 표시**: 답변마다 출처 뱃지, 클릭 시 원문에서 질문 키워드를 하이라이트한 사이드패널
- **관련 문서 없음 처리**: 질문과 관련된 문서가 없으면 출처를 붙이지 않고 "관련 내용 없음"으로 응답
- **Slack 연동**: `@techdocs` 멘션으로 채널에서 바로 질문 (Socket Mode)
- **GitHub 연동**: 레포 URL 입력 → 레포 내 `.md` 파일 크롤링 → 인덱싱

---

## 기술 스택

### 프론트엔드

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- shadcn/ui, react-dropzone, react-markdown, shiki

### 백엔드

- FastAPI, sse-starlette
- LangChain (텍스트 분할), pdfplumber
- ChromaDB, sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`), rank-bm25
- Groq API (`qwen/qwen3.8-27b`)
- slack-bolt (Socket Mode)

### 배포 및 개발 도구

- Vercel (프론트엔드), Hugging Face Spaces Docker (백엔드)
- GitHub Actions: `main` 브랜치의 `backend/` 변경 시 HF Spaces로 자동 동기화
- Jira + Claude Code (Jira MCP), Husky, commitlint, Playwright E2E

---

## 아키텍처

```
[브라우저]                         [Slack]
    │ POST + SSE 스트리밍              │ Socket Mode (WebSocket)
    ▼                                  ▼
[Next.js — Vercel]          [FastAPI — Hugging Face Spaces]
    │                                  │
    └──────────── REST / SSE ─────────►│
                                       ├── /upload     → 청킹 → 임베딩 → ChromaDB
                                       ├── /documents  → 목록, 삭제, 인덱싱 상태(SSE)
                                       ├── /chat       → 하이브리드 검색 → Groq 스트리밍
                                       └── /github     → GitHub API 크롤링 → 인덱싱
                                               │
                                   [ChromaDB] ←→ [Groq API]
```

웹 채팅과 Slack 봇은 같은 `hybrid_search` 함수를 사용해 채널과 관계없이 동일한 검색 결과를 반환한다.

---

## 기술 선택 이유

| 선택                                    | 이유                                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 하이브리드 검색 (BM25 + 시맨틱)         | 기술 문서는 함수명, 에러 코드처럼 정확히 일치해야 하는 키워드가 많아 의미 검색과 키워드 검색 점수를 정규화 후 합산 (0.5 : 0.5) |
| 관련도 임계값 (코사인 거리 0.7)         | 가장 가까운 청크도 임계값을 넘으면 검색 결과를 비워, 무관한 질문에 출처 뱃지가 붙는 문제 방지                                  |
| sentence-transformers (다국어 모델)     | 로컬 실행으로 임베딩 비용 없음, 한국어 문서 지원                                                                               |
| Groq                                    | 무료 티어, 빠른 토큰 생성 속도                                                                                                 |
| SSE (not WebSocket)                     | 단방향 스트리밍에 충분, 서버 구현 단순                                                                                         |
| fetch + SSE 직접 파싱 (not EventSource) | EventSource는 GET만 지원해 질문과 대화 기록을 body로 보낼 수 없음                                                              |
| Slack Socket Mode (not Webhook)         | 공개 URL 없이 로컬과 배포 환경에서 동일하게 동작, 배포 URL이 바뀌어도 Slack App 설정 변경 불필요                               |
| Vercel + Hugging Face Spaces            | 프론트/백엔드 분리 배포, 신용카드 없이 무료로 백엔드 운영 가능                                                                 |

---

## 트러블슈팅

### 1. 스트리밍 답변에서 코드 블록 개행이 사라지는 문제

- **현상**: 답변에 코드 블록이 포함되면 줄바꿈이 사라져 한 줄로 렌더링됨
- **원인**: 여러 줄 데이터는 SSE에서 `data:` 줄 여러 개로 전송되는데, 파서가 매 줄마다 값을 덮어써 마지막 줄만 남음
- **해결**: SSE 스펙대로 같은 이벤트 안의 `data:` 줄을 개행으로 이어 붙이도록 수정, 빈 `sources` 이벤트 방어 로직 추가

### 2. 무관한 질문에도 출처 뱃지가 표시되는 문제

- **현상**: 문서와 관련 없는 질문에도 가장 가까운 청크가 출처로 표시됨
- **원인**: 하이브리드 검색이 상대 점수로 상위 K개를 항상 반환
- **해결**: 시맨틱 검색의 최소 코사인 거리가 0.7을 넘으면 검색 결과를 비우도록 사전 확인 단계 추가

### 3. GitHub 레포 재인덱싱 시 청크가 중복 저장되는 문제

- **현상**: 같은 레포를 다시 인덱싱하면 이전 청크가 남아 검색 결과에 중복 노출
- **해결**: 재인덱싱 전에 해당 레포의 기존 청크를 삭제하고, httpx 클라이언트를 요청마다 새로 만들지 않고 재사용

---

## 알려진 제약

배포 환경(Hugging Face Spaces 무료 컨테이너) 기준으로 확인한 제약이다. 상세 내용은 [Troubleshooting](docs/TROUBLESHOOTING.md) 참고

- 컨테이너가 재시작되면 업로드한 문서와 벡터 인덱스가 초기화됨
- HF 프록시에서 간헐적으로 502가 반환됨 (측정 기준 약 10%, 원인 미확인)
- 채팅 답변이 토큰 단위로 스트리밍되지 않고 생성이 끝난 뒤 한 번에 표시됨
- 브라우저 탭을 여러 개 열면 인덱싱 진행률이 한쪽 탭에만 표시될 수 있음

---

## 로컬 실행

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- Groq API Key ([무료 발급](https://console.groq.com))
- (선택) Slack Bot Token, App Token

### 프론트엔드

```bash
npm install
cp .env.example .env.local  # NEXT_PUBLIC_API_URL 확인 (기본값: http://localhost:8000)
npm run dev
```

### 백엔드

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # GROQ_API_KEY 입력, Slack 연동 시 SLACK_BOT_TOKEN, SLACK_APP_TOKEN 입력
uvicorn main:app --reload
```

### E2E 테스트

```bash
npm run e2e:setup   # 최초 1회
npm run e2e         # headless
npm run e2e:headed  # 브라우저 직접 확인
```

---

## 문서

- [PRD](docs/PRD.md): 문제 정의, 기능 요구사항
- [PLAN](docs/PLAN.md): 개발 계획 및 아키텍처
- [Contributing](docs/CONTRIBUTING.md): 커밋, 브랜치 컨벤션
- [Troubleshooting](docs/TROUBLESHOOTING.md): 배포 환경 점검 및 문제 해결 기록
- [feature/](docs/feature): 기능별 spec 및 ADR
