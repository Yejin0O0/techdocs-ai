# PLAN — TechDocs AI

> 하루 3~4시간 기준 / 총 약 46시간 / FE 비중 70~75%

---

## 아키텍처 개요

```
[사용자]
  │
  ├── 웹 브라우저 (Next.js 14 · App Router)
  │     ├── 파일 업로드 UI (react-dropzone)
  │     ├── 채팅 UI — SSE 스트리밍
  │     └── 출처 사이드패널
  │
  └── Slack (@멘션)
        │
        ▼
[FastAPI 백엔드]
  ├── /upload        — 청킹 → 임베딩 → ChromaDB 저장
  ├── /chat          — 벡터 검색 → Groq 스트리밍
  ├── /docs          — 문서 목록 관리
  ├── /docs/status   — 인덱싱 상태 SSE 스트리밍
  ├── /docs/:id      — 문서 삭제
  └── /github        — GitHub API 크롤링 → 인덱싱
        │
        ▼
[ChromaDB]  ←→  [Groq API]
```

---

## 1주차 — 세팅 & UI 기반

### Day 1 (월) — 프로젝트 세팅 `3h`

- [x] Next.js 14 + TypeScript + Tailwind 초기화
- [x] 폴더 구조 생성 (`app/`, `lib/`, `types/`)
- [x] 타입 정의 (`types/index.ts`)
- [x] PRD, PLAN 작성
- [x] FileUploader 컴포넌트 초안
- [x] GitHub 레포 생성 및 초기 커밋

### Day 2 (화) — RAG 백엔드 최소 구현 `3h`

- [x] FastAPI 기본 서버 세팅
- [x] LangChain + ChromaDB 설치 및 연결
- [x] PDF 업로드 → 청킹 → 벡터 저장 파이프라인
- [x] `/upload`, `/docs` 엔드포인트 구현
- [x] `/docs/status` (SSE) 엔드포인트 구현
- [x] `/docs/:id` (DELETE) 엔드포인트 구현
- [x] `/chat` (스트리밍) 엔드포인트 구현

### Day 3 (수) — 파일 업로드 UI 완성 `4h`

- [ ] 업로드 진행률 바
- [ ] 파일 목록 UI — 상태 뱃지: 인덱싱 중 / 준비 완료 / 오류
- [ ] 파일 삭제 기능
- [ ] 중복 파일명 업로드 시 경고 UI
- [ ] 백엔드 `/upload`, `/docs`, `/docs/status` SSE, `/docs/:id` DELETE 연결

### Day 4 (목) — 채팅 UI + 스트리밍 `4h`

- [ ] 채팅 인터페이스 (`ChatWindow.tsx`)
- [ ] 말풍선 UI — user / assistant 구분
- [ ] SSE로 스트리밍 답변 렌더링
- [ ] 자동 스크롤, 대화 기록 상태 관리

### Day 5 (금) — 출처 표시 UI `3h`

- [ ] 출처 뱃지 컴포넌트 (`SourceBadge.tsx`)
- [ ] 원문 하이라이트 사이드패널 (`SourcePanel.tsx`)
- [ ] 뱃지 클릭 → 사이드패널 오픈 연결

### Day 6 (토) — UX 디테일 `4h`

- [ ] Skeleton 로딩 / 에러 상태 / 빈 상태 UI
- [ ] 다크모드 + 반응형 레이아웃

### Day 7 (일) — 버퍼 `2h`

- [ ] 밀린 작업 마무리
- [ ] 업로드 → 질문 → 스트리밍 → 출처 전체 흐름 E2E 확인

---

## 2주차 — 연동 & 완성

### Day 8 (월) — GitHub 연동 UI `3h`

- [ ] GitHub 레포 URL 입력 컴포넌트 (`GithubInput.tsx`)
- [ ] 인덱싱 진행 상태 실시간 표시 (SSE)
- [ ] 코드 블록 Syntax Highlight (`react-syntax-highlighter`)

### Day 9 (화) — GitHub API 백엔드 연결 `4h`

- [ ] GitHub API — README, 코드 주석 크롤링 → 벡터 저장
- [ ] `/github` 엔드포인트 구현 및 프론트 연결

### Day 10 (수) — Slack 연동 `3h`

- [ ] Slack App 생성 (Bolt SDK), @멘션 → RAG 답변 전송
- [ ] Slack 연동 설정 UI (`SlackSettings.tsx`)

### Day 11 (목) — 문서 비교 & 필터 UI `4h`

- [ ] 문서 선택 필터 (검색 범위 지정)
- [ ] 비교 쿼리 결과 나란히 보기 UI

### Day 12 (금) — 배포 `3h`

- [ ] Vercel 프론트엔드 배포
- [ ] Railway 백엔드 배포
- [ ] 환경변수 설정, 도메인 연결 확인

### Day 13 (토) — 포트폴리오 정리 `4h`

- [ ] 데모 GIF 녹화
- [ ] README 작성 (아키텍처, 기술 선택 이유, 트러블슈팅)
- [ ] 이력서 한 줄 요약 문구 작성

### Day 14 (일) — 최종 점검 `2h`

- [ ] 전체 기능 end-to-end 테스트
- [ ] UI 폴리싱 마지막 손질

---

## 트러블슈팅 로그

> 개발 중 마주친 이슈와 해결 방법을 여기에 기록합니다. README 작성 시 활용.

| 날짜 | 이슈 | 원인 | 해결 |
| ---- | ---- | ---- | ---- |
| -    | -    | -    | -    |
