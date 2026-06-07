# Chat Frontend — Spec Fixed

## 기능 개요

업로드된 문서를 기반으로 AI에게 질문하고 답변을 받는 채팅 인터페이스.

---

## 핵심 동작

- 질문 입력 후 Enter 전송 / Shift+Enter 줄바꿈 / 전송 버튼 클릭 전송
- 답변은 SSE 스트리밍으로 실시간 렌더링 (타이핑 효과, 커서 표시)
- user는 오른쪽 / assistant는 왼쪽 말풍선으로 구분
- 새 메시지가 추가되면 자동으로 맨 아래로 스크롤
- 스트리밍 중 전송 버튼 비활성화
- 메시지가 없을 때 빈 상태 안내 문구 표시
- assistant 답변은 마크다운 렌더링 (`react-markdown`)
- SSE 수신은 `EventSource` 대신 `fetch` + `ReadableStream` 사용
  - `EventSource`는 GET 전용이라 history를 body에 담은 POST 요청에 사용 불가

---

## 대화 기록

- 대화 기록은 세션(탭) 동안만 유지 — React state로 관리, localStorage 미사용
  - 포트폴리오 데모 시나리오에서 탭 하나 열어두고 쓰는 것으로 충분, localStorage/서버 저장은 구현 비용 대비 이점 없음
- history를 백엔드 Groq에 전달 — 이전 대화 내용을 API 요청에 포함하여 멀티턴 대화 지원
  - "방금 말한 그 API는?" 같은 후속 질문이 맥락 없이 동작하는 문제를 방지
  - 프론트 표시용으로만 유지하는 방안도 검토했으나, 실제 사용성 저하로 미채택

---

## 출처 표시

- 답변 하단에 출처 파일명을 뱃지(`SourceBadge`) 형태로 표시
- 뱃지 클릭 시 원문 하이라이트 사이드패널(`SourcePanel`) 오픈
- **Day 4 임시 구현**: 뱃지 대신 텍스트(`📎 파일명`)로 표시, Day 5에서 SourceBadge/SourcePanel로 교체 예정

---

## 백엔드 연결

- 질문 전송 시 `POST /chat` 호출 — `{ question: string, history: { role, content }[] }`
- SSE 이벤트 형식:
  - `event: message` — 텍스트 청크 (plain string), 청크마다 수신
  - `event: sources` — 출처 파일명 배열 (JSON), 스트리밍 완료 후 한 번

---

## 데이터 구조 참고

- `ChatMessage.isStreaming` — 스트리밍 중인 메시지 식별, 완료 시 `false`로 변경
- `ChatMessage.sources` — Day 5 SourceBadge 교체를 위해 optional로 보유
- history 전달 시 `{ role, content }`만 포함 — `id`, `isStreaming`, `sources`는 프론트 전용 필드로 제외

---

## 엣지 케이스

- **스트리밍 중 재전송** — `isLoading` 상태일 때 전송 버튼 비활성화, 중복 요청 차단
- **빈 입력** — 공백만 있는 입력은 전송 차단
- **응답 오류** — 서버 연결 실패 또는 비정상 응답 시 assistant 말풍선에 에러 메시지 표시
