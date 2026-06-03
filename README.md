# TechDocs AI

> 기술 문서를 업로드하면 AI가 출처와 함께 답변하는 RAG 기반 챗봇

<!-- 데모 GIF -->
<!-- ![demo](https://your-demo-gif-url) -->

<!-- 배포 URL -->
<!-- 🔗 [라이브 데모](https://your-vercel-url.vercel.app) -->

---

## 주요 기능

- **문서 업로드** — PDF, MD, TXT Drag & Drop, 자동 벡터 인덱싱
- **AI 채팅** — SSE 스트리밍 답변, 마크다운 + 코드 블록 렌더링
- **출처 표시** — 답변마다 출처 뱃지, 클릭 시 원문 하이라이트 사이드패널
- **GitHub 연동** — 레포 URL 입력 → README·코드 주석 자동 인덱싱
- **Slack 연동** — `@techdocs` 멘션으로 채널에서 바로 질문

---

## 기술 스택

### 프론트엔드

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- react-dropzone · react-markdown · axios

### 백엔드

- FastAPI · LangChain · ChromaDB · sentence-transformers · Groq API

### 배포

- Vercel (프론트) · Railway (백엔드)

---

## 아키텍처

```
[브라우저 / Slack]
       │
       ▼
[Next.js 14 — App Router]
       │  SSE 스트리밍
       ▼
[FastAPI]
  ├── /upload  → 청킹 → 임베딩 → ChromaDB
  ├── /chat    → 벡터 검색 → Groq 스트리밍
  └── /github  → GitHub API 크롤링 → 인덱싱
       │
       ▼
[ChromaDB]  ←→  [Groq API]
```

---

## 로컬 실행

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- Groq API Key ([무료 발급](https://console.groq.com))

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
cp .env.example .env  # GROQ_API_KEY 입력
uvicorn main:app --reload
```

---

## 기술 선택 이유

| 선택                | 이유                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| Next.js App Router  | 서버 컴포넌트로 초기 로딩 최적화, SSE 처리 용이                                      |
| FastAPI             | Python 생태계(LangChain, sentence-transformers, ChromaDB) 활용, 비동기 스트리밍 지원 |
| ChromaDB            | 로컬 실행 가능, 설정 없이 빠른 프로토타이핑                                          |
| SSE (not WebSocket) | 단방향 스트리밍에 충분, 서버 구현 단순                                               |

---

## 트러블슈팅

<!-- 개발 중 마주친 이슈와 해결 과정을 여기에 추가 -->

---

## 문서

- [PRD](docs/PRD.md) — 문제 정의, 기능 요구사항
- [PLAN](docs/PLAN.md) — 개발 계획 및 아키텍처
- [Contributing](docs/CONTRIBUTING.md) — 커밋·브랜치 컨벤션
