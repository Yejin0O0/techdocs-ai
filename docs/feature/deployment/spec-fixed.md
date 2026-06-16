# 배포 — Spec Fixed

## 구성

```
[사용자 브라우저]
      ↓ HTTPS
[Vercel — Next.js 프론트엔드]
      ↓ HTTPS (NEXT_PUBLIC_API_URL)
[HuggingFace Spaces — FastAPI 백엔드]
      ├── ChromaDB (로컬 파일, ephemeral)
      └── Groq API / Slack Bolt
```

---

## Vercel 프론트엔드 배포

### 배포 방식

- GitHub 레포 연결 → main 브랜치 push 시 자동 배포
- `vercel.json`으로 프레임워크 명시

### `vercel.json`

```json
{
  "framework": "nextjs"
}
```

### 환경변수

| 변수                  | 값                                                                           |
| --------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | HuggingFace Spaces URL (예: `https://yejin0o0-techdocs-ai-backend.hf.space`) |

---

## HuggingFace Spaces 백엔드 배포

### 배포 방식

- HuggingFace Space 생성 → GitHub 레포 연결 → 자동 빌드·배포
- SDK: Docker
- `Dockerfile`로 Python 환경 빌드, 포트 7860 (HF Spaces 기본 포트)

### `Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Secrets (환경변수)

HuggingFace Space Settings → Secrets에서 설정

| 변수              | 값                                                     |
| ----------------- | ------------------------------------------------------ |
| `GROQ_API_KEY`    | Groq API 키                                            |
| `ALLOWED_ORIGIN`  | Vercel 배포 URL (예: `https://techdocs-ai.vercel.app`) |
| `SLACK_BOT_TOKEN` | xoxb-...                                               |
| `SLACK_APP_TOKEN` | xapp-...                                               |

---

## CORS 환경변수 처리

`main.py`의 `allow_origins`를 하드코딩 대신 `ALLOWED_ORIGIN` 환경변수로 관리.

```python
import os

allowed_origins = ["http://localhost:3000"]
if os.getenv("ALLOWED_ORIGIN"):
    allowed_origins.append(os.getenv("ALLOWED_ORIGIN"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    ...
)
```

---

## ChromaDB 데이터 지속성

- **에페머럴 허용**: 재배포/재시작 시 ChromaDB 데이터 초기화
- 데모 전에 직접 문서를 재업로드하는 방식으로 운영

---

## 배포 순서

1. **HuggingFace Spaces 먼저** — 백엔드 URL이 확정돼야 Vercel 환경변수에 넣을 수 있음
2. **Vercel 나중** — HF Spaces URL을 `NEXT_PUBLIC_API_URL`에 설정 후 배포

### 체크리스트

- [ ] `Dockerfile` 추가 커밋
- [ ] `vercel.json` 추가 커밋
- [ ] `main.py` CORS 환경변수 처리 커밋
- [ ] huggingface.co 계정 생성 (무료, 신용카드 불필요)
- [ ] New Space 생성 → SDK: Docker → GitHub 레포 연결 → Root directory: `backend/`
- [ ] Space Settings → Secrets 설정 (GROQ_API_KEY, SLACK 토큰)
- [ ] 빌드 완료 → `https://[username]-[spacename].hf.space/health` 응답 확인
- [ ] HF Spaces URL 확인
- [ ] Vercel GitHub 레포 연결
- [ ] Vercel 환경변수 설정 (`NEXT_PUBLIC_API_URL` = HF Spaces URL)
- [ ] Space Settings → Secrets에 `ALLOWED_ORIGIN` = Vercel URL 추가
- [ ] Vercel 배포 완료 → E2E 동작 확인
