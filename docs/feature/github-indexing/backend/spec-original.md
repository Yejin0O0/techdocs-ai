# GitHub 인덱싱 — Backend 기능 정의서

## 기능 개요

GitHub 공개 레포의 .md 파일을 GitHub API로 크롤링하여 청킹·벡터 임베딩 후 ChromaDB에 저장한다.

## 기능 요구사항

- 레포 URL을 받아 인덱싱을 시작할 수 있다
- 인덱싱 진행 상태를 SSE로 실시간 전송한다
- 인덱싱된 레포를 삭제할 수 있다 (ChromaDB 청크 제거)

## 비고

- 공개 레포만 지원한다 (GitHub API 인증 불필요)
- 크롤링 대상은 .md 파일 전체다
- GitHub REST API를 사용해 레포 트리를 조회한다
