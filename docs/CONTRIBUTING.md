# Contributing Guide

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) 스펙을 따릅니다.

### 형식

```
<type>(SCRUM-N): <subject>

[body]

[footer]
```

- `SCRUM-N`은 관련 JIRA 이슈 키 (JIRA-GitHub 연동으로 커밋이 이슈에 자동 연결됨)
- 관련 이슈가 없는 경우 scope 생략: `docs: prd 업데이트`

---

### Type

| Type       | 설명                                           |
| ---------- | ---------------------------------------------- |
| `feat`     | 새로운 기능 추가                               |
| `fix`      | 버그 수정                                      |
| `docs`     | 문서 변경 (코드 변경 없음)                     |
| `style`    | 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음) |
| `refactor` | 버그 수정도 기능 추가도 아닌 코드 리팩터링     |
| `test`     | 테스트 추가 또는 수정                          |
| `chore`    | 빌드 설정, 패키지 업데이트 등 기타 변경        |
| `perf`     | 성능 개선                                      |
| `ci`       | CI/CD 설정 변경                                |
| `revert`   | 이전 커밋 되돌리기                             |

---

### Subject

- 한국어 권장, 마침표 없음 (commitlint로 강제되지 않음)
- 명령형 현재 시제 사용 (`추가`, `수정`, `제거` — `추가했음`, `수정됨` X)
- 50자 이내 권장

---

### Body (선택)

- 한국어 권장 (commitlint로 강제되지 않음)
- Subject 아래 빈 줄 하나 띄운 뒤 작성
- **무엇을** 했는지보다 **왜** 했는지 설명
- 72자마다 줄 바꿈

---

### Footer (선택)

- `BREAKING CHANGE:` — 하위 호환성이 깨지는 변경 사항 명시
- `Closes #<issue>` — 관련 이슈 닫기

---

### 예시

```
feat(SCRUM-12): 채팅 인터페이스 ChatWindow.tsx 구현
```

```
fix(SCRUM-14): SSE 스트리밍 파싱 오류 수정

버퍼 경계에서 이벤트 블록이 잘리는 문제 수정.
\n\n 기준 분리 후 미완성 블록을 버퍼에 보관하도록 변경.
```

```
feat(SCRUM-16): 출처 뱃지 클릭 시 하이라이트 패널 오픈

BREAKING CHANGE: SourceBadge에 onOpen prop 필수로 추가됨
```

```
chore: next 업그레이드
```

```
docs: prd에 jira+mcp 워크플로우 섹션 추가
```

---

## 브랜치 컨벤션

### 형식

```
<type>/SCRUM-<N>-<short-description>
```

- `SCRUM-N`은 관련 JIRA 이슈 키
  - **Epic 단위 작업** (여러 태스크 포함): Epic 번호 사용 → `feature/SCRUM-1-chat-ui`
  - **단일 태스크 작업**: 태스크 번호 사용 → `fix/SCRUM-14-sse-streaming`
- `short-description`은 영어 소문자 + 하이픈 구분 (kebab-case)
- 작업 단위로 브랜치 생성, 완료 후 main에 머지

### 예시

```
feature/SCRUM-1-chat-ui
fix/SCRUM-14-sse-streaming
docs/SCRUM-36-readme
refactor/SCRUM-20-source-panel
```
