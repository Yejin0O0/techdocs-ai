# GitHub 인덱싱 — Frontend Spec Fixed

## 기능 개요

파일 목록 탭에 GithubInput 섹션을 추가하여 공개 GitHub 레포 URL을 인덱싱하고, 기존 FileList에 문서와 함께 표시한다.

---

## UI 구조

```
파일 목록 탭
├── FileUploader   (기존)
├── ── 구분선 ──
├── GithubInput    ← 추가
└── FileList       (기존 — 파일 + GitHub 레포 통합 표시)
```

---

## 핵심 동작

- URL 입력 후 인덱싱 버튼 클릭 → `POST /github` 호출
- 인덱싱 중 FileList에 진행률 바 표시 (기존 `uploading` 진행률 바 재사용)
- 완료 후 FileList에 `준비 완료` 상태로 표시
- 오류 시 FileList에 `오류` 상태 + 에러 메시지 표시 (재시도 버튼 없음 — 삭제 후 재추가)
- 같은 레포 URL 중복 입력 시 경고 (파일 중복 패턴과 동일)

---

## 타입 설계

GitHub 레포는 기존 `UploadedDocument` 타입을 그대로 사용한다.

| 필드       | GitHub 레포에서의 값               |
| ---------- | ---------------------------------- |
| `id`       | 백엔드에서 발급한 UUID             |
| `name`     | `owner/repo`                       |
| `size`     | 크롤링된 .md 파일 수 (바이트 아님) |
| `status`   | `indexing` → `ready` \| `error`    |
| `progress` | 0~100 (파일 처리 진행률)           |

별도 `GithubRepo` 타입 없음 — FileList, StatsPanel, useDocuments 재사용 가능.

---

## 컴포넌트

| 컴포넌트    | 위치                                    | 역할                     |
| ----------- | --------------------------------------- | ------------------------ |
| GithubInput | `app/components/upload/GithubInput.tsx` | URL 입력 + 인덱싱 트리거 |

---

## 백엔드 연결

- `POST /github` — `{ url }` 전송 → `UploadedDocument` 형태로 응답 수신
- 인덱싱 진행률은 기존 `/documents/status` SSE 확장으로 수신 (`progress` 필드 추가)
  - 별도 SSE 연결 없음, `subscribeDocumentStatus` 재사용
- `DELETE /documents/:id` — 기존 삭제 API 그대로 사용

`lib/api.ts`에 `indexGithubRepo(url: string): Promise<UploadedDocument>` 추가.

---

## URL 유효성 검사

- 패턴: `https://github.com/<owner>/<repo>`
- 정규식: `/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/`
- 실패 시 입력 필드 아래에 에러 텍스트 표시 (제출 차단)

---

## Syntax Highlighting

- 패키지: `shiki`
  - VS Code와 동일한 TextMate 문법 기반, 하이라이팅 품질이 높음
  - `dangerouslySetInnerHTML` 없이 `codeToTokens`로 토큰 단위 JSX 렌더 가능
  - 언어별 lazy load로 번들 크기 최소화
- 위치: `MessageBubble.tsx` → `CodeBlock.tsx` (별도 컴포넌트)
  - `codeToTokens`가 async라 `useEffect` + `useState` 패턴 필요 → 분리
  - 로딩 중 fallback: 플레인 코드 블록 표시
- 다크모드: `document.documentElement.classList.contains('dark')` 감지
  - 라이트: `github-light` / 다크: `one-dark-pro`
- 인라인 코드(`<code>` without language)는 기존 스타일 유지, 블록 코드만 하이라이팅

---

## 엣지 케이스

| 상황                | 처리                                                   |
| ------------------- | ------------------------------------------------------ |
| 잘못된 URL 형식     | 입력 필드 아래 에러 텍스트, 제출 차단                  |
| 같은 레포 중복 입력 | 경고 다이얼로그 (파일 중복과 동일 패턴)                |
| 인덱싱 오류         | FileList에 `오류` 상태 + 에러 메시지, 재시도 버튼 없음 |
| .md 파일 없음       | 백엔드 400 → FileList에 오류 상태                      |
