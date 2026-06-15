# Slack 연동 — Backend 기능 정의서

## 기능 개요

Slack 채널에서 봇을 멘션하면 인덱싱된 문서를 기반으로 답변을 스레드에 전송한다.

## 기능 요구사항

- 채널에서 `@TechDocs AI [질문]` 형식으로 멘션하면 답변을 받을 수 있다
- 답변은 기존 RAG 파이프라인(하이브리드 검색 → Groq API)을 그대로 사용한다
- 답변에는 참조한 문서 출처가 포함된다
- FastAPI 서버와 함께 단일 프로세스에서 실행된다

## 비고

- Slack Bolt SDK를 사용한다
- 토큰은 환경변수로 관리한다 (`SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`)
