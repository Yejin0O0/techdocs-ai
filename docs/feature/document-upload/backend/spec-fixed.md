# Document Upload Backend — Spec Fixed

## 기능 개요

사용자가 업로드한 파일을 텍스트로 변환하고 벡터 DB에 저장한다.

---

## 핵심 동작

- `.pdf`, `.md`, `.txt` 파일만 허용 / 최대 10MB (백엔드에서도 검증)
- 업로드 즉시 문서 ID와 상태(`indexing`)를 반환하고, 청킹 + 임베딩 + 저장은 백그라운드에서 처리
- 처리 완료 후 상태가 `ready`로 변경되며 SSE로 프론트에 푸시
- 업로드된 파일은 메모리에서만 처리하고 디스크에 저장하지 않음

---

## 처리 파이프라인

```
파일 업로드 (POST /upload)
    ↓
파일 형식 / 크기 검증
    ↓
텍스트 추출 (pdfplumber / 직접 읽기)
    ↓
청킹 (RecursiveCharacterTextSplitter / 500토큰 / overlap 50)
    ↓
임베딩 (sentence-transformers)
    ↓
ChromaDB 저장
    ↓
SSE로 상태 변경 (indexing → ready) 전송
```

---

## 기술 결정

- **임베딩 모델**: `sentence-transformers` — 무료 로컬 실행, OpenAI API 불필요
- **LLM**: Groq API — 무료 티어, Llama/Gemma 등 오픈소스 모델 제공
- **청킹**: 고정 크기 (`RecursiveCharacterTextSplitter`, 500토큰, overlap 50)
- **PDF 추출**: `pdfplumber` — 텍스트 기반 PDF 처리, OCR 미지원
- **중복 문서**: 파일명 기반 ID로 기존 문서 덮어쓰기 (기존 청크 삭제 후 재저장)
- **문서 ID**: 파일명 기반 생성 — 같은 파일명 업로드 시 자동으로 기존 문서 덮어쓰기, 구현 단순
- **상태 전달**: SSE 단일 스트림 (`GET /documents/status`) — 모든 문서 상태 변경을 하나의 연결로 수신, N개 연결 방지

---

## 엔드포인트

### `POST /upload`

- **Request**: `multipart/form-data` — 파일
- **Response**: `{ id: string, name: string, size: number, status: "indexing" }`
- 처리는 백그라운드, 응답은 즉시 반환

### `GET /documents`

- **Response**: `[{ id, name, size, status }]`
- 현재 저장된 문서 목록 반환

### `GET /documents/status` (SSE)

- 단일 스트림으로 모든 문서 상태 변경 이벤트 전송
- `{ id: string, status: "ready" | "error", errorMessage?: string }`

### `DELETE /documents/:id`

- ChromaDB에서 해당 문서의 모든 청크 삭제
- **Response**: `{ id: string, status: "deleted" }`

---

## 엣지 케이스

- **파일 형식 오류** — 허용 외 형식이면 `400` 반환
- **파일 크기 초과** — 10MB 초과 시 `400` 반환
- **텍스트 추출 실패** — 손상된 파일 등 파싱 오류 시 상태 `error` + SSE로 전송
- **임베딩 실패** — sentence-transformers 오류 시 상태 `error` + SSE로 전송
