# PRD — UX 디테일 Frontend

## 1. 개요

로딩·에러·빈 상태 UI, 다크모드 토글, 반응형 레이아웃을 추가하여 전반적인 UX 완성도를 높인다.

---

## 2. 사용자 스토리

| ID    | 역할   | 스토리                                          | 완료 조건                                                              |
| ----- | ------ | ----------------------------------------------- | ---------------------------------------------------------------------- |
| US-01 | 실무자 | AI가 답변 중임을 시각적으로 확인하고 싶다       | 전송 후 첫 토큰 수신 전까지 채팅 말풍선 위치에 Skeleton UI가 표시된다  |
| US-02 | 실무자 | 채팅 오류 발생 시 쉽게 재시도하고 싶다          | 에러 말풍선 하단 재시도 버튼 클릭 시 마지막 질문이 자동 재전송된다     |
| US-03 | 실무자 | 문서가 없을 때 무엇을 해야 할지 안내받고 싶다   | 문서 목록이 비어있을 때 업로드 유도 안내 문구가 표시된다               |
| US-04 | 실무자 | 처음 접속 시 어떤 질문을 할 수 있는지 알고 싶다 | 채팅 기록이 없을 때 예시 질문 3개가 표시되며 클릭 시 입력창에 채워진다 |
| US-05 | 실무자 | 선호하는 화면 모드(다크/라이트)로 사용하고 싶다 | 헤더 토글 버튼으로 전환 가능하며 새로고침 후에도 유지된다              |
| US-06 | 실무자 | 모바일에서도 불편없이 사용하고 싶다             | 모바일에서 업로드·채팅 패널이 탭으로 전환되며 레이아웃이 깨지지 않는다 |

---

## 3. 기술 결정 (ADR)

### ADR-01: 다크모드 구현 방식

**Context** — Tailwind `dark:` 클래스를 사용해 다크모드를 구현할 때 "어떻게 모드를 감지하고 전환할지" 결정이 필요했다. 직접 구현(classList 토글)과 라이브러리(`next-themes`) 두 방안을 검토했다.

**Decision** — `next-themes` 라이브러리를 사용한다.

**Alternatives**

- _직접 구현 (classList 토글)_ — 의존성 없이 `document.documentElement.classList.toggle('dark')`와 `localStorage`로 구현 가능. 단, SSR 환경에서 hydration mismatch 처리를 직접 해야 하며, 시스템 설정 감지(`prefers-color-scheme`)도 별도 구현 필요

**Consequences**

- (+) hydration mismatch 자동 처리 — Next.js SSR 환경에서 안전
- (+) 시스템 설정 자동 감지, localStorage 저장, 수동 전환 모두 내장
- (+) 초기 로드 시 잘못된 테마가 잠깐 보이는 FOUC(Flash of Unstyled Content) 방지
- (+) 5분 이내 설정 완료
- (-) 패키지 의존성 1개 추가 (~3KB 번들 증가)

---

### ADR-02: 모바일 레이아웃 — 탭 전환 vs 스크롤

**Context** — 모바일에서 업로드 패널과 채팅 패널 두 영역을 어떻게 보여줄지 결정이 필요했다. 탭 전환과 위아래 스크롤 두 방안을 검토했다.

**Decision** — 탭 전환 방식을 사용한다.

**Alternatives**

- _위아래 스크롤_ — 구현이 단순하나 채팅 패널이 화면 아래에 있어 접근하려면 스크롤이 필요. 채팅이 주 사용 흐름인데 진입 장벽이 생김

**Consequences**

- (+) 각 패널이 전체 화면을 사용해 모바일에서 가독성 좋음
- (+) 채팅 패널을 기본 탭으로 설정해 주 사용 흐름에 빠르게 접근
- (+) 탭 상태로 현재 컨텍스트가 명확 — 사용자가 어느 패널에 있는지 항상 인지 가능
- (-) 탭 상태 관리 코드 추가 필요
- (-) 두 패널을 동시에 볼 수 없음 (모바일 화면 크기상 허용 가능한 트레이드오프)
- (-) 탭 전환 시 각 패널의 스크롤 위치가 초기화될 수 있음

---

### ADR-03: Skeleton 로딩 표시 범위

**Context** — 채팅 응답 대기 중 Skeleton을 언제까지 표시할지 결정이 필요했다. "첫 토큰 전까지"와 "스트리밍 완료까지" 두 방안을 검토했다.

**Decision** — 첫 토큰 수신 전까지만 Skeleton을 표시한다.

**Alternatives**

- _스트리밍 완료까지_ — Skeleton 위에 텍스트가 점진적으로 쌓이는 어색한 UI 발생. 스트리밍 중에는 이미 커서 애니메이션이 "응답 중" 상태를 충분히 표현함

**Consequences**

- (+) 기존 스트리밍 커서 애니메이션과 자연스럽게 연결 — 대기 → 스트리밍의 단계가 명확
- (+) 구현 단순 — `isStreaming && content === ''` 조건으로 판단 가능
- (-) Skeleton 노출 시간이 짧아 빠른 응답 시 거의 안 보일 수 있음 (허용 가능)

---

### ADR-04: 탭 상태 관리 위치

**Context** — 모바일 탭 전환 상태(업로드/채팅)를 어디서 관리할지 결정이 필요했다. page.tsx 인라인 상태, `useMobileTab` 커스텀 훅, Context API 세 방안을 검토했다.

**Decision** — `useMobileTab` 커스텀 훅으로 분리한다.

**Alternatives**

- _page.tsx 인라인_ — 가장 단순하나 page.tsx에 레이아웃 + 상태 + 탭 로직이 혼재
- _Context API_ — 여러 컴포넌트에서 탭 상태가 필요할 때 적합하나 현재 범위에서 과잉 설계

**Consequences**

- (+) page.tsx가 레이아웃 역할에 집중, 탭 로직은 훅에 캡슐화
- (+) useDocuments, useChat, useSourcePanel과 동일한 훅 분리 패턴으로 일관성 유지
- (+) 기본 탭, 탭 전환 애니메이션 등 추가 요구사항 생겨도 훅만 수정하면 됨
- (-) 파일 1개 추가 (useMobileTab.ts)
- (-) 단순 boolean 상태를 위한 훅이라 과잉으로 느껴질 수 있음

---

### ADR-05: 헤더 위치

**Context** — 다크모드 토글을 포함한 헤더를 어느 레이어에 배치할지 결정이 필요했다. layout.tsx 전역 배치와 page.tsx 페이지별 배치 두 방안을 검토했다.

**Decision** — `layout.tsx`에 전역 배치한다.

**Alternatives**

- _page.tsx_ — page가 이미 `'use client'`라 서버 컴포넌트 이점은 없으나 유연성은 높음. 현재 앱이 단일 페이지라 전역 배치와 실질적 차이 없음

**Consequences**

- (+) Header 자체는 서버 컴포넌트, ThemeToggle만 `'use client'`로 분리해 클라이언트 번들 최소화
- (+) 향후 페이지 추가 시 자동으로 헤더 적용
- (-) layout.tsx 수정 필요 (기존 TooltipProvider와 함께 구성)

---

### ADR-06: 에러 재시도 구조

**Context** — 채팅 API 실패 시 재시도 기능을 어디서 관리할지 결정이 필요했다. useChat 훅 내부와 ChatWindow 컴포넌트 두 방안을 검토했다.

**Decision** — `useChat`에 `retryLastMessage`를 추가한다.

**Alternatives**

- _ChatWindow에서 lastQuestion 관리_ — UI 컴포넌트에 재시도 로직이 혼재. useChat이 관리하는 messages 상태와 lastQuestion이 분리되어 동기화 오류 가능성

**Consequences**

- (+) 채팅 관련 로직(전송, 에러 처리, 재시도)이 useChat에 집중
- (+) ChatWindow는 UI 렌더링에만 집중
- (+) `isError` 플래그를 `ChatMessage` 타입에 포함시켜 메시지 상태와 함께 관리 — 에러 메시지가 대화 기록에 자연스럽게 통합됨
- (-) useChat 내부에서 sendMessage를 참조하는 순환 의존 패턴 주의 필요 (`useCallback` 의존성 배열 관리)
- (-) `lastQuestion` 상태가 useChat 안에 추가되어 훅이 다소 복잡해짐

---

### ADR-07: SourcePanel 모바일 대응

**Context** — SourcePanel은 우측 slide-in 방식인데, 모바일에서 패널 너비가 화면 대부분을 차지해 어색할 수 있다. 현재 유지와 bottom sheet 전환 두 방안을 검토했다.

**Decision** — 모바일(`md` 미만)에서 bottom sheet로 전환한다. shadcn `Drawer` 컴포넌트(base-ui `Drawer` 기반) 활용.

**Alternatives**

- _현재 유지 (right slide-in)_ — 드래그로 75vw까지 조절 가능해 허용 가능한 수준이나, 모바일 표준 패턴과 다름

**Consequences**

- (+) 모바일에서 자연스러운 UX — bottom sheet는 모바일 네이티브 패턴
- (+) shadcn Drawer 컴포넌트 활용으로 별도 구현 최소화
- (+) bottom sheet는 스와이프로 닫기 가능 — 터치 인터랙션에 적합
- (-) `useMediaQuery` 또는 Tailwind 브레이크포인트 감지 로직 추가 필요
- (-) SourcePanel이 Sheet/Drawer 이중 분기 구조로 복잡해짐
- (-) Drawer는 드래그 너비 조절 기능과 충돌 — 모바일에서는 너비 조절 비활성화 필요

---

## 4. Out of Scope

- 에러 로그 수집 / Sentry 연동
- 업로드 에러 자동 재시도
- 다크모드 서버 사이드 렌더링 (hydration mismatch 방지로 클라이언트 전용)
- 질문 예시 서버 연동 (하드코딩)

---

## 5. 용어 정의

| 용어     | 정의                                                                    |
| -------- | ----------------------------------------------------------------------- |
| Skeleton | 콘텐츠 로딩 중 실제 UI 영역을 대체하는 회색 플레이스홀더 애니메이션     |
| 빈 상태  | 데이터가 없는 상황(문서 없음, 대화 없음)에서 표시되는 안내 UI           |
| 다크모드 | 어두운 배경과 밝은 텍스트로 구성된 화면 테마                            |
| 탭 전환  | 모바일에서 업로드 패널과 채팅 패널을 탭 버튼으로 교체하는 레이아웃 방식 |
