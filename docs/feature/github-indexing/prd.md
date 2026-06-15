# PRD — GitHub 인덱싱

## 1. 개요

GitHub 공개 레포 URL을 입력하면 .md 파일을 자동으로 크롤링·인덱싱하여 기존 문서와 동일하게 AI 채팅에서 질문할 수 있다.

### 왜 이 기능이 필요한가

TechDocs AI의 핵심 타겟 문서(기술 스펙, API 문서, 아키텍처 가이드)는 대부분 GitHub 레포에 존재한다. 현재 구조에서는 이 문서들을 로컬로 다운로드한 뒤 다시 업로드해야 하는 마찰이 있다. GitHub URL 하나로 인덱싱하면 이 마찰을 제거하고 "GitHub 레포 = 문서 소스"로 업로드 파일과 동등하게 취급할 수 있다.

### 왜 Syntax Highlighting이 함께 포함되는가

GitHub 레포를 인덱싱하면 AI 답변에 코드 블록이 포함될 확률이 높아진다. 코드 블록 가독성이 없으면 GitHub 인덱싱 기능의 실용적 가치가 크게 떨어진다. 두 기능이 함께 있어야 "코드 레포를 문서로 활용하는 RAG"가 완성된다.

---

## 2. 사용자 스토리

| ID    | 역할   | 스토리                                                       | 완료 조건                                                         |
| ----- | ------ | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| US-01 | 담당자 | GitHub 레포 URL 하나로 팀 기술 문서를 빠르게 인덱싱하고 싶다 | URL 입력 후 인덱싱이 시작되고 완료 시 문서 목록에 표시된다        |
| US-02 | 실무자 | 코드 레포의 문서를 파일 업로드 없이 바로 질문하고 싶다       | 인덱싱된 레포의 내용을 기반으로 AI 답변과 출처가 반환된다         |
| US-03 | 담당자 | 인덱싱 진행 상황을 실시간으로 확인하고 싶다                  | 인덱싱 중 진행률 바와 처리 중인 파일 메시지가 실시간으로 표시된다 |

---

## 3. 기술 결정 (ADR)

### ADR-01: GithubRepo 별도 타입 없이 UploadedDocument 재사용

**Context** — GitHub 레포를 문서 목록에 표시하기 위해 타입을 새로 만들지, 기존 타입을 재사용할지 결정이 필요했다.

**Decision** — 별도 `GithubRepo` 타입을 만들지 않고 `UploadedDocument`를 그대로 사용한다. `name`은 `owner/repo`, `size`는 크롤링된 파일 수로 매핑한다.

**Alternatives**

- _별도 `GithubRepo` 타입_ — 필드 의미가 명확해지지만 FileList, StatsPanel, useDocuments 등 모든 소비처를 union 타입으로 수정해야 함

**Consequences**

- (+) FileList, StatsPanel, useDocuments 변경 없이 재사용 가능
- (+) 삭제 API도 기존 `DELETE /documents/:id` 그대로 사용 가능
- (-) `size` 필드의 의미가 "바이트"에서 "파일 수"로 바뀌어 의미 혼동 가능
- (-) GitHub 레포 전용 필드(URL 등) 추가 시 `UploadedDocument` 타입 오염

---

### ADR-02: 별도 SSE 엔드포인트 없이 /documents/status 확장

**Context** — 인덱싱 진행률을 실시간으로 전달하기 위해 별도 SSE 엔드포인트를 만들지, 기존 `/documents/status`를 확장할지 결정이 필요했다.

**Decision** — 기존 `/documents/status` SSE 이벤트에 `progress` 필드를 추가하여 재사용한다. 프론트엔드 SSE 연결은 하나로 유지한다.

**Alternatives**

- _별도 `/github/status` SSE_ — 관심사 분리가 명확하지만 프론트엔드에서 SSE 연결을 두 개 유지해야 하고, 구독 로직 중복 발생

**Consequences**

- (+) 프론트엔드 SSE 연결 수 유지 (1개)
- (+) `subscribeDocumentStatus` 훅 재사용 가능
- (-) 기존 문서 상태 이벤트 스키마에 `progress` 필드가 추가되어 결합도 증가
- (-) 향후 GitHub 전용 이벤트 타입 추가 시 단일 스트림에서 분기 처리 필요

---

### ADR-03: GitHub API 미인증 (공개 레포 전용)

**Context** — GitHub API 호출 시 인증 토큰 없이 공개 레포만 지원할지, 토큰 입력을 받아 private 레포도 지원할지 결정이 필요했다.

**Decision** — 인증 없이 공개 레포만 지원한다. GitHub API unauthenticated rate limit(60req/h)을 감수한다.

**Alternatives**

- _GitHub Personal Access Token 입력 지원_ — private 레포 접근 가능, rate limit 5000req/h로 증가. 단 토큰 입력 UI, 보안 처리, 환경변수 관리 등 복잡도 증가

**Consequences**

- (+) 구현 단순, 인증 관련 보안 처리 불필요
- (+) 포트폴리오 데모는 공개 레포로 충분
- (-) rate limit 60req/h — 대형 레포(.md 파일 다수) 인덱싱 시 제한 도달 가능
- (-) private 레포 지원 불가

---

## 4. Out of Scope

- Private 레포 지원 (GitHub 토큰 관리 복잡도 대비 효용 낮음)
- .md 외 소스코드 파일 크롤링 (토큰 초과 및 노이즈 위험)
- 레포 변경사항 자동 재인덱싱 (webhook 연동 필요, 포트폴리오 범위 초과)
- 인덱싱된 레포 재인덱싱 (삭제 후 재추가로 대체)

---

## 5. 용어 정의

| 용어      | 정의                                                      |
| --------- | --------------------------------------------------------- |
| 레포 트리 | GitHub API로 조회한 레포 내 전체 파일 경로 목록           |
| 진행률    | 전체 .md 파일 수 대비 처리 완료된 파일 수의 비율 (0~100%) |
