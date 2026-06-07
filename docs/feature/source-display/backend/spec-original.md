# Source Display Backend — Spec Original

## 기능 개요

AI 답변 생성 시 참고한 문서 청크의 출처 정보를 함께 반환한다.

## 기능 요구사항

- AI 답변과 함께 참고한 청크의 출처 정보(파일명, 페이지 번호, 청크 원문)를 반환한다.
- 출처는 유사도 높은 순으로 최대 3개까지 반환한다.
- 청크 원문은 사이드패널에서 하이라이트 표시에 사용된다.

## 비고

- 엔드포인트: `POST /chat`
- 응답 예시:
  ```json
  {
    "answer": "Redis TTL은 EXPIRE 명령어로 설정합니다.",
    "sources": [
      {
        "fileName": "redis-docs.pdf",
        "page": 12,
        "chunk": "EXPIRE key seconds 명령어를 사용하면..."
      }
    ]
  }
  ```
