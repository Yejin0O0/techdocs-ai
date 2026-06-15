# GitHub 인덱싱 — Backend Spec Fixed

## 기능 개요

GitHub 공개 레포의 .md 파일을 GitHub REST API로 크롤링하여 청킹·벡터 임베딩 후 ChromaDB에 저장한다. 진행 상태는 기존 `/documents/status` SSE로 전송한다.

---

## 핵심 동작

- `POST /github` 요청 즉시 `{ id, name, status: "indexing" }` 응답 반환
- 크롤링·임베딩은 백그라운드 처리
- 파일 처리마다 진행률(`progress`)을 기존 `/documents/status` SSE로 전송
- 완료 시 `status: "ready"` 이벤트 전송
- 오류 시 `status: "error" + errorMessage` 이벤트 전송

---

## 처리 파이프라인

```
POST /github { url }
    ↓
URL 파싱 → owner/repo 추출
    ↓
GitHub API: GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1
    ↓
.md 파일 목록 필터링 (없으면 400 반환)
    ↓
각 파일 fetch → 텍스트 추출
    ↓
청킹 (RecursiveCharacterTextSplitter, 500토큰, overlap 50)
    ↓
임베딩 (sentence-transformers)
    ↓
ChromaDB 저장 (metadata: { source: "github", repo: "owner/repo", path: "..." })
    ↓
파일마다 SSE progress 이벤트 전송
    ↓
완료: SSE status: "ready" 전송
```

---

## SSE 확장

기존 `/documents/status` SSE 이벤트에 `progress` 필드 추가. 별도 엔드포인트 없음.

```json
// 진행 중
{ "id": "uuid", "status": "indexing", "progress": 42 }

// 완료
{ "id": "uuid", "status": "ready", "progress": 100 }

// 오류
{ "id": "uuid", "status": "error", "errorMessage": "..." }
```

---

## 엔드포인트

### `POST /github`

- **Request**: `{ "url": "https://github.com/owner/repo" }`
- **Response**: `{ "id": "uuid", "name": "owner/repo", "size": 0, "status": "indexing", "uploadedAt": "..." }`
  - `size`는 완료 후 SSE로 크롤링된 파일 수 전달
- 처리는 백그라운드, 응답은 즉시 반환

### `DELETE /documents/:id`

- GitHub 레포 삭제도 기존 문서 삭제 엔드포인트 재사용
- ChromaDB에서 `metadata.repo == "owner/repo"` 청크 전체 제거

---

## 기술 결정

- **GitHub API 인증**: 없음 (공개 레포, rate limit: 60req/h)
- **중복 레포**: 동일 `owner/repo`로 기존 데이터 존재 시 409 반환
- **파일 수 상한**: 없음 (rate limit 내에서 처리)

---

## 엣지 케이스

| 상황                       | 처리                        |
| -------------------------- | --------------------------- |
| 존재하지 않는 레포         | GitHub API 404 → `400` 반환 |
| .md 파일 없음              | `400` 반환                  |
| 중복 레포                  | `409` 반환                  |
| GitHub API rate limit 초과 | `429` 반환                  |
| 파일 fetch 실패            | 해당 파일 스킵 후 계속 진행 |
