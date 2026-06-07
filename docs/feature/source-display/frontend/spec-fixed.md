# Source Display Frontend — Spec Fixed

## 기능 개요

AI 답변에 참고한 문서의 출처를 뱃지로 표시하고, 클릭 시 해당 청크 원문을 사이드패널에서 확인할 수 있다.

---

## 핵심 동작

- 스트리밍 완료 후 답변 하단에 출처 뱃지(`SourceBadge`) 표시
- 뱃지는 유사도 높은 순으로 최대 3개, 같은 파일이라도 청크별로 각각 표시
- 뱃지 클릭 시 원문 하이라이트 사이드패널(`SourcePanel`) 오픈
- 사이드패널은 닫기 버튼 또는 바깥 영역 클릭으로 닫힘
- Day 4의 텍스트 출처 표시(`📎 파일명`)를 SourceBadge로 교체

---

## 출처 뱃지 (SourceBadge)

- 표시 형식: `파일명 · p.페이지` (PDF) / `파일명` (MD·TXT — 페이지 번호 없음)
  - 예: `redis-docs.pdf · p.12`, `README.md`
- 최대 3개 표시 — 유사도 높은 순으로 백엔드가 정렬해서 전달
- 같은 파일에서 여러 청크가 매칭된 경우 청크별로 각각 표시
  - RAG가 청크 단위로 동작함을 시각적으로 드러냄
- 클릭 시 해당 청크의 SourcePanel 오픈

---

## 원문 사이드패널 (SourcePanel)

- 우측에서 슬라이드인 방식으로 오픈
- 표시 내용:
  - 파일명 + 페이지 번호 (헤더)
  - 청크 원문 텍스트
  - 질문 키워드 단순 하이라이트 — 질문을 공백으로 분리 후 청크에서 일치하는 단어 `<mark>` 처리
- 닫기: 우측 상단 닫기 버튼 또는 패널 바깥 영역 클릭

---

## 백엔드 연결

- `POST /chat` 응답의 `sources` 이벤트 형식 변경:
  - 기존: `string[]` (파일명 배열)
  - 변경: `{ fileName: string, page?: number, chunk: string }[]`
- `ChatMessage.sources` 타입 변경 반영 필요

---

## 데이터 구조 참고

- `ChatSource` 타입 신규 추가 (`types/index.ts`)
  ```ts
  interface ChatSource {
    fileName: string;
    page?: number; // PDF만, MD·TXT는 undefined
    chunk: string; // 청크 원문 (키워드 하이라이트 및 사이드패널 표시용)
  }
  ```
- `ChatMessage.sources` 타입: `string[]` → `ChatSource[]`

---

## 엣지 케이스

- **출처 없음** — sources 배열이 비어있으면 뱃지 영역 미표시
- **스트리밍 중** — isStreaming 상태에서는 뱃지 미표시, 완료 후 표시
- **페이지 없음** — MD·TXT 파일은 페이지 번호 없이 파일명만 표시
- **키워드 없음** — 하이라이트할 단어가 없으면 원문만 표시
