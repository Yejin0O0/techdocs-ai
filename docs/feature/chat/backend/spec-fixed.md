# Chat Backend — Spec Fixed

## 기능 개요

사용자 질문에 대해 관련 문서를 검색하고 AI가 답변을 생성하여 스트리밍으로 반환한다.

---

## 핵심 동작

- 질문을 임베딩하여 ChromaDB에서 유사 청크 Top 5 검색
- 검색된 청크를 context로 구성하여 Groq LLM에 전달
- 이전 대화 history를 system prompt와 현재 질문 사이에 삽입하여 멀티턴 대화 지원
  - history 기본값 `[]` — history 없이 요청해도 단일 턴으로 정상 동작
- 답변은 SSE 스트리밍으로 청크 단위 전송
- 스트리밍 완료 후 출처 파일명 배열을 `sources` 이벤트로 전송

---

## 처리 흐름

```
POST /chat { question, history }
    ↓
question 임베딩 (sentence-transformers)
    ↓
ChromaDB 유사도 검색 (Top 5)
    ↓
Groq messages 구성
  [system prompt]
  [history...]
  [user: context + question]
    ↓
Groq 스트리밍 생성
    ↓
event: message (청크) × N
event: sources (출처 파일명 배열)
```

---

## 백엔드 연결

### `POST /chat`

**Request**

```json
{
  "question": "string",
  "history": [
    { "role": "user", "content": "이전 질문" },
    { "role": "assistant", "content": "이전 답변" }
  ]
}
```

**Response** (SSE)

```
event: message
data: 답변 텍스트 청크

event: sources
data: ["파일명1.pdf", "파일명2.md"]
```

---

## 데이터 구조 참고

- Top K: 5 — 품질과 응답 속도의 균형점. 3개는 관련 내용 누락 가능성, 10개는 토큰 비용 및 지연 증가
- history는 `{ role, content }`만 수신 — 프론트 전용 필드(`id`, `isStreaming` 등) 제외

---

## 엣지 케이스

- **history 없음** — 기본값 `[]`, 단일 턴 질문으로 처리
- **GROQ_API_KEY 미설정** — 서버 시작 시 예외 발생
- **ChromaDB 비어있음** — 검색 결과 없이 Groq 호출, "관련 내용을 찾을 수 없어요" 반환
