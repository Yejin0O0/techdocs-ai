# Document Upload Backend — Spec Original

## 기능 개요

사용자가 업로드한 파일을 텍스트로 변환하고 벡터 DB에 저장한다.

---

## 기능 요구사항

- PDF, MD, TXT 파일을 업로드할 수 있다.
- 업로드된 파일은 일정 크기(청크)로 분할된다.
- 분할된 청크는 벡터로 변환되어 ChromaDB에 저장된다.
- 업로드 즉시 문서 ID와 상태(indexing)를 반환하고, 청킹 + 임베딩 + 저장은 백그라운드에서 처리한다.
- 처리 완료 후 상태가 ready로 변경된다.

---

## 비고

- 지원 파일 형식: `.pdf`, `.md`, `.txt`
- 엔드포인트: `POST /upload`
