# Contributing Guide

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) 스펙을 따릅니다.

### 형식

```
<type>: <subject>

[body]

[footer]
```

---

### Type

| Type | 설명 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 (코드 변경 없음) |
| `style` | 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음) |
| `refactor` | 버그 수정도 기능 추가도 아닌 코드 리팩터링 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 빌드 설정, 패키지 업데이트 등 기타 변경 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 설정 변경 |
| `revert` | 이전 커밋 되돌리기 |

---

### Subject

- 한국어로 작성, 마침표 없음
- 명령형 현재 시제 사용 (`추가`, `수정`, `제거` — `추가했음`, `수정됨` X)
- 50자 이내 권장

---

### Body (선택)

- 한국어로 작성
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
feat: AI 응답 SSE 스트리밍 추가
```

```
fix: 파일 크기 초과 시 에러 처리

10MB 초과 파일 업로드 시 앱이 조용히 크래시되는 문제 수정.
인라인 에러 메시지와 제한 용량을 함께 표시하도록 변경.
```

```
feat: 출처 뱃지 클릭 시 하이라이트 패널 오픈

BREAKING CHANGE: SourceBadge에 onOpen prop 필수로 추가됨
```

```
chore: next 14.2.0으로 업그레이드
```

```
docs: 포트폴리오용 PRD, PLAN 개선
```

---

## 브랜치 컨벤션

### 형식

```
<type>/<short-description>
```

- `type`은 커밋 컨벤션의 type과 동일하게 사용
- `short-description`은 영어 소문자 + 하이픈 구분 (kebab-case)
- 작업 단위로 브랜치 생성, 완료 후 main에 머지

### 예시

```
feat/chat-streaming
fix/upload-size-error
docs/contributing-guide
refactor/source-panel
chore/upgrade-next
```
