# 트러블슈팅: 배포 환경

> 2026-09-29 배포 환경(Vercel + Hugging Face Spaces) 점검 중 발생한 문제와 해결 기록
> 개발 중 트러블슈팅은 [README](../README.md#트러블슈팅) 참고

## 점검 방법

- 대상: 백엔드 `https://yejinyun-techdocs-ai-backend.hf.space`, 프론트 `https://techdocs-ai.vercel.app`
- 테스트 레포: `https://github.com/octocat/Spoon-Knife` (`.md` 파일 1개)
- 순서: `GET /health`, `POST /github`, `GET /documents/status`(SSE), `GET /documents`, `POST /chat`
- Space 상태는 HF API `GET /api/spaces/{owner}/{space}`의 `runtime.stage`, `runtime.errorMessage`로 확인

## 요약

| #   | 문제                                              | 상태                        |
| --- | ------------------------------------------------- | --------------------------- |
| 1   | Space 스케줄링 실패로 백엔드 전체 중단            | 해결                        |
| 2   | `/chat` 스트림이 데이터 없이 끊김 (API 키 미설정) | 해결                        |
| 3   | Secret 값에 여러 줄이 들어가 Groq 호출 실패       | 해결                        |
| 4   | Slack 토큰 추가 후 컨테이너 시작 실패             | 해결 (설정), 코드 개선 필요 |
| 5   | Groq 모델 404                                     | 해결                        |
| 6   | HF 프록시 간헐적 502                              | 미해결                      |
| 7   | Space 재시작 시 인덱싱 데이터 소실                | 미해결 (알려진 제약)        |
| 8   | CORS preflight 결과만으로 설정 검증 불가          | 점검 방법 정리              |

---

### 1. Space 스케줄링 실패로 백엔드 전체 중단

- **현상**: 모든 엔드포인트가 `503 Your space is in error`를 반환
- **원인**: HF API 기준 `runtime.stage: RUNTIME_ERROR`, `errorMessage: "Scheduling failure: unable to schedule"`, 할당된 하드웨어 없음(`hardware.current: null`). HF 측에서 컨테이너를 배치하지 못한 상태로, 코드 문제는 아님
- **해결**: Space Settings에서 Restart Space 실행. 약 2분 후 `RUNNING`으로 전환

### 2. `/chat` 스트림이 데이터 없이 끊김 (API 키 미설정)

- **현상**: `POST /chat`이 HTTP 200과 `text/event-stream` 헤더를 보낸 뒤 0.2초 만에 0바이트로 종료 (`HTTP/2 stream was not closed cleanly: INTERNAL_ERROR`)
- **원인**: HF Space Secrets에 `GROQ_API_KEY`가 없어 `get_groq_client()`가 `ValueError: GROQ_API_KEY 환경변수가 설정되지 않았어요.`를 발생. SSE 응답이 이미 시작된 뒤라 에러 응답 대신 스트림이 끊김
- **해결**: Space Secrets에 `GROQ_API_KEY` 추가
- **참고**: 스트리밍 응답은 헤더 전송 후 예외가 나면 상태 코드가 200으로 남기 때문에, 응답 코드만으로는 실패를 알 수 없음. 컨테이너 로그 확인 필요

### 3. Secret 값에 여러 줄이 들어가 Groq 호출 실패

- **현상**: 키 추가 후에도 `/chat`이 약 3초 뒤 0바이트로 종료
- **원인**: `.env` 파일 내용을 통째로 붙여넣어 Secret 값에 키 외에 줄바꿈과 다른 변수 줄이 포함됨. 로그: `httpx.LocalProtocolError: Illegal header value b'Bearer gsk_...\n...'`, 이어서 `groq.APIConnectionError: Connection error.`
- **해결**: Secret을 다시 입력해 값에는 키 문자열 한 줄만 넣음
- **참고**: HF는 저장된 Secret 값을 다시 보여주지 않아 화면에서는 형식 오류를 확인할 수 없음. 로그에 키 값이 평문으로 남으므로 노출된 키는 폐기 후 재발급

### 4. Slack 토큰 추가 후 컨테이너 시작 실패

- **현상**: Space Secrets에 `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` 추가 후 재빌드 시 `RUNTIME_ERROR (Exit code: 1)`. 웹 API 전체가 중단됨
- **원인**: `backend/slack_bot.py`가 모듈 import 시점에 `AsyncApp(token=bot_token)`을 생성하는데, slack-bolt는 기본적으로 요청 서명 검증을 켜기 때문에 `SLACK_SIGNING_SECRET`이 없으면 `ValueError: signing_secret must not be empty.` 발생. `main.py`가 이 모듈을 import하므로 앱 전체가 시작되지 않음
- **해결**: Space Secrets에 `SLACK_SIGNING_SECRET` 추가
- **개선 방향**: Socket Mode만 사용하므로 HTTP 요청 서명 검증은 필요 없음. Slack 초기화 실패가 웹 API 기동을 막지 않도록 서명 검증 비활성화 또는 예외 처리 후 봇만 건너뛰는 방식 검토. `backend/.env.example`에도 `SLACK_SIGNING_SECRET` 명시 필요

### 5. Groq 모델 404

- **현상**: 키 형식 수정 후에도 `/chat`이 약 3초 뒤 0바이트로 종료
- **원인**: 로그 `groq.NotFoundError: Error code: 404 - The model 'qwen/qwen3-32b' does not exist or you do not have access to it. (model_not_found)`. 현재 키로 조회한 모델 목록(`GET https://api.groq.com/openai/v1/models`)에 `qwen/qwen3-32b`가 없음. 개발 당시(2026-06) 사용하던 모델을 현재는 쓸 수 없음
- **해결**: `backend/routers/chat.py`의 `MODEL`을 같은 Qwen 계열인 `qwen/qwen3.8-27b`로 변경 (커밋 `0dcf4f3`). `slack_bot.py`는 같은 상수를 import하므로 함께 적용됨
- **결과**: 인덱싱한 레포 README 내용을 묻는 질문에 답변과 출처(`octocat/Spoon-Knife`)가 정상 반환됨
- **참고**: 새 모델 답변에 영어 단어가 섞이는 사례 1건 확인 (`과정을Practice할 수 있도록`)

### 6. HF 프록시 간헐적 502

- **현상**: 가벼운 `GET /health`에서도 HF 500 에러 페이지와 함께 HTTP 502가 간헐적으로 반환됨. 측정 결과 4/20, 0/30, 5/40회 (전체 약 10%)
- **원인**: 미확인. replica 1개, 측정 중 `runtime.stage`는 `RUNNING` 유지. 응답 본문이 앱이 아닌 HF 에러 페이지라 HF 프록시 단계에서 실패하는 것으로 추정
- **개선 방향**: 프론트 API 호출에 502 재시도 로직 추가 검토. 재현 조건(콜드 스타트 직후 여부 등) 추가 관찰 필요

### 7. Space 재시작 시 인덱싱 데이터 소실

- **현상**: Space 재시작 또는 Secret 변경으로 재빌드될 때마다 `GET /documents`가 `[]`로 초기화됨
- **원인**: 문서 목록(`docs_store`)은 메모리에, ChromaDB는 컨테이너 로컬 디스크에 저장. HF Spaces 무료 컨테이너는 재시작 시 디스크가 초기화됨
- **개선 방향**: HF Spaces persistent storage 또는 외부 벡터 DB 사용 검토. 데모용이라면 기동 시 샘플 문서 자동 인덱싱도 방법

### 8. CORS preflight 결과만으로 설정 검증 불가

- **현상**: Vercel Origin으로 보낸 `OPTIONS` preflight에 `access-control-allow-origin`이 반환됐지만, 임의 도메인(`https://evil.example.com`)으로 보내도 같은 헤더가 반환됨
- **원인**: preflight는 HF 프록시가 요청 Origin을 그대로 돌려주며 응답함. 앱의 `ALLOWED_ORIGIN` 설정과 무관
- **확인 방법**: 실제 요청(`GET /documents`)에 Origin 헤더를 붙여 응답의 `vary: Origin`(대문자 O, Starlette CORSMiddleware가 추가) 유무로 판단. Vercel 도메인과 `localhost:3000`에서만 붙고 임의 도메인에는 붙지 않음을 확인해 `ALLOWED_ORIGIN` 설정이 올바름을 검증
