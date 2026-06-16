# PRD — 배포

## 1. 개요

Vercel(프론트엔드) + Railway(백엔드) 조합으로 외부에서 접근 가능한 데모 환경을 구성한다. 배포 완료 후 면접·포트폴리오 데모에서 실제 동작하는 URL을 제공할 수 있다.

---

## 2. 사용자 스토리

| ID    | 역할   | 스토리                                  | 완료 조건                                                      |
| ----- | ------ | --------------------------------------- | -------------------------------------------------------------- |
| US-01 | 개발자 | 면접관에게 동작하는 URL을 보여주고 싶다 | Vercel URL로 접속해 파일 업로드 → AI 답변 전체 흐름이 동작한다 |
| US-02 | 개발자 | 코드 push 시 자동으로 재배포되길 원한다 | main 브랜치 push → Vercel 자동 빌드·배포 완료                  |

---

## 3. 기술 결정 (ADR)

### ADR-01: ChromaDB 데이터 지속성 — 에페머럴 허용

**Context** — Railway 파일시스템은 재시작·재배포 시 초기화된다. ChromaDB가 로컬 파일 기반이라 배포 후 데이터가 사라지는 문제가 있었다.

**Decision** — 에페머럴을 허용한다. 데모 전에 직접 문서를 재업로드한다.

**Alternatives**

- _Railway Volume_ — 영구 볼륨 마운트로 데이터 보존. 코드 변경 없이 설정만으로 해결. 단 Railway Hobby 플랜($5/월) 이상 필요.
- _Chroma Cloud_ — 관리형 ChromaDB 서비스. 무료 티어 있음. `PersistentClient` → `HttpClient` 코드 변경 필요.

**Consequences**

- (+) 코드 변경 없음, 추가 비용 없음
- (+) 포트폴리오 데모는 본인이 직접 준비하므로 재업로드 비용이 낮음
- (-) 재배포마다 문서 재업로드 필요
- (-) 24시간 운영 서비스로 전환 시 반드시 Volume 또는 외부 DB로 교체 필요

---

### ADR-02: Vercel + HuggingFace Spaces 분리 배포

**Context** — 프론트엔드와 백엔드를 같은 플랫폼에 올릴지, 분리할지 결정이 필요했다. Vercel 계정은 이미 있고, 백엔드 플랫폼은 신용카드 없이 무료로 쓸 수 있는 곳을 찾아야 했다.

논의 흐름:

- Railway: $5/월 Hobby 플랜, 신용카드 필요 → 포트폴리오 프로젝트에 비용 부담 → 기각
- Fly.io: 무료 티어가 있다고 알려졌으나 확인 결과 신용카드 필수, 신규 사용자 무료 플랜 없음 → 기각
- Render: 무료지만 15분 비활성 후 슬립 → 면접 데모에서 첫 요청 60초 지연 발생 → 기각
- Koyeb: 무료 티어 있지만 cold start 정책 불확실, 커뮤니티 자료 부족 → 불확실
- HuggingFace Spaces: 완전 무료(신용카드 불필요), 슬립 없음, 2 vCPU + 16GB RAM, Docker 지원. 레포가 이미 public이라 public 레포 요건도 충족. 이 프로젝트 자체가 AI 앱이라 AI 플랫폼에 올리는 것이 오히려 맥락에 맞음 → 채택

**Decision** — Vercel(FE) + HuggingFace Spaces(BE)로 분리 배포한다.

**Alternatives**

- _Railway_ — FastAPI 네이티브 지원, 설정 간단. 단 $5/월 신용카드 필요.
- _Fly.io_ — 개발자 커뮤니티 인지도 있음. 단 신규 사용자 무료 플랜 없음, 신용카드 필수.
- _Render_ — 무료, 신용카드 불필요. 단 15분 슬립으로 데모에 불리.

**Consequences**

- (+) Vercel: Next.js 공식 지원, 자동 CDN, push → 자동 배포
- (+) HuggingFace Spaces: 완전 무료, 신용카드 불필요, 슬립 없음
- (+) 스펙 충분 (2 vCPU, 16GB RAM) — sentence-transformers 구동에 여유 있음
- (+) AI 앱을 AI 플랫폼에 배포 — 포트폴리오 맥락에 자연스러움
- (-) CORS 설정을 Vercel URL에 맞게 추가해야 함 → `ALLOWED_ORIGIN` 환경변수로 관리
- (-) HuggingFace Spaces는 일반 백엔드 API 호스팅 용도로는 덜 알려진 선택
- (-) 두 플랫폼의 배포 상태를 각각 모니터링해야 함

---

### ADR-03: HuggingFace Spaces 설정 — `Dockerfile`

**Context** — HuggingFace Spaces는 Docker SDK를 사용할 경우 `Dockerfile`로 빌드 환경을 정의한다. 배포 설정을 코드로 관리할지, HuggingFace Spaces UI에서 직접 설정할지 결정이 필요했다.

논의 흐름:

- UI에서 직접 설정하면 빠르지만, 설정이 레포에 남지 않아 "어떻게 배포했는지"를 알 수 없다는 문제를 제기
- `Dockerfile`을 코드에 두면 Python 버전, 의존성 설치 방식, 포트 설정이 레포에 명시돼 재현 가능하고, 포트폴리오 레포를 보는 사람도 배포 방법을 바로 파악할 수 있다는 점에서 채택
- HuggingFace Spaces 기본 포트는 7860 — Dockerfile CMD에 명시

**Decision** — `Dockerfile`을 코드에 추가해 관리한다.

**Alternatives**

- _HuggingFace Spaces UI 직접 설정_ — 코드 변경 없이 빠르게 설정 가능. 단 설정이 레포에 기록되지 않아 재현이 어렵다.

**Consequences**

- (+) 배포 설정이 레포에 문서화 — 재현 가능한 배포 환경
- (+) 포트폴리오에서 "어떻게 배포했는지" 코드로 보여줄 수 있음
- (+) Python 버전(3.11-slim)과 포트(7860)가 코드에 명시됨
- (-) 설정 변경 시 커밋 필요

---

### ADR-04: CORS — 환경변수 관리

**Context** — Vercel 배포 URL이 배포 전에는 확정되지 않는다. `allow_origins`에 Vercel URL을 하드코딩하는 방식과 환경변수로 관리하는 방식 중 선택이 필요했다.

논의 흐름:

- "환경변수로 관리하는 게 나을 것 같은데 어떻게 생각하냐"는 질문에서 출발
- 하드코딩 방식은 Vercel URL이 바뀔 때마다 코드 수정·커밋·재배포가 필요하다는 점에서 불편함. 반면 환경변수 방식은 HuggingFace Spaces Secrets에서 값만 바꾸면 끝
- 로컬 개발 시엔 `ALLOWED_ORIGIN`이 없어도 `localhost:3000`을 기본 허용하도록 코드를 작성하면 로컬/배포 환경 분기도 자연스럽게 해결됨
- 두 이유 모두 환경변수 방식이 낫다는 데 동의해 채택

**Decision** — `ALLOWED_ORIGIN` 환경변수로 관리한다.

**Alternatives**

- _하드코딩_ — 코드가 단순해지지만 URL 변경 시 커밋 필요. 로컬/배포 환경 분기도 직접 관리해야 함.

**Consequences**

- (+) Vercel URL 변경 시 HF Spaces Secrets 값만 수정하면 됨 — 커밋 불필요
- (+) 로컬 개발 시 `ALLOWED_ORIGIN` 없이도 `localhost:3000` 자동 허용
- (-) 환경변수를 HuggingFace Spaces Secrets에 추가해야 하는 설정 단계 하나 더 필요

---

## 4. Out of Scope

- 커스텀 도메인 연결
- CI/CD 파이프라인 고도화 (테스트 통과 후 배포 등)
- 백엔드 스케일링 (HuggingFace Spaces 단일 인스턴스로 충분)
- ChromaDB 데이터 백업

---

## 5. 용어 정의

| 용어         | 정의                                                              |
| ------------ | ----------------------------------------------------------------- |
| 에페머럴     | 재시작 시 상태가 초기화되는 일시적 스토리지                       |
| CORS         | Cross-Origin Resource Sharing — 다른 도메인 간 API 호출 허용 설정 |
| `Dockerfile` | HuggingFace Spaces 빌드 환경을 코드로 관리하는 파일               |
