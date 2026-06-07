# Source Display Backend — Spec Fixed

## 기능 개요

AI 답변 생성 시 참고한 문서 청크의 출처 정보(파일명, 페이지 번호, 청크 원문)를 함께 반환한다.

---

## 핵심 동작

- 하이브리드 검색 결과에서 유사도 높은 순으로 최대 3개의 청크를 출처로 반환
- 같은 파일이라도 청크별로 각각 반환 (중복 허용)
- PDF는 청킹 시 페이지 번호를 metadata에 저장, 반환 시 포함
- MD·TXT는 페이지 번호 없이 파일명 + 청크 원문만 반환
- 스트리밍 완료 후 `sources` SSE 이벤트로 전송

---

## 변경 사항

### `/upload` — 청킹 시 page metadata 추가

PDF 청킹 시 각 청크가 몇 번째 페이지에서 나왔는지 metadata에 저장.

```python
# 기존
metadatas=[{"doc_id": doc_id, "filename": filename, "size": size}]

# 변경
metadatas=[{"doc_id": doc_id, "filename": filename, "size": size, "page": page_number}]
# MD·TXT는 page 필드 생략
```

### `/chat` — sources 형식 변경

```python
# 기존
sources = list({m["filename"] for m in metadatas if "filename" in m})
yield {"event": "sources", "data": json.dumps(sources)}

# 변경 (최대 3개, 청크 원문 포함)
sources = [
    {
        "fileName": m["filename"],
        "page": m.get("page"),   # PDF만 존재, MD·TXT는 None
        "chunk": chunk,
    }
    for chunk, m in zip(chunks[:3], metadatas[:3])
    if m and "filename" in m
]
yield {"event": "sources", "data": json.dumps(sources)}
```

---

## 백엔드 연결

### `POST /chat` SSE — sources 이벤트

```json
// 기존
["redis-docs.pdf", "README.md"]

// 변경
[
  { "fileName": "redis-docs.pdf", "page": 12, "chunk": "EXPIRE key seconds 명령어를 사용하면..." },
  { "fileName": "redis-docs.pdf", "page": 15, "chunk": "TTL 명령어로 남은 만료 시간을 확인할 수 있다." },
  { "fileName": "README.md", "chunk": "Redis는 인메모리 데이터 구조 저장소로..." }
]
```

---

## 데이터 구조 참고

- `page`는 optional — PDF 파일만 존재, MD·TXT는 `null`
- 청크 순서는 하이브리드 검색 점수 내림차순 (유사도 높은 순)
- 최대 3개 반환 — Top K(5)에서 상위 3개만 출처로 노출

---

## 엣지 케이스

- **ChromaDB 비어있음** — chunks가 없으면 sources 빈 배열 반환
- **metadata 누락** — `filename` 없는 청크는 출처에서 제외
- **PDF 페이지 추출 실패** — pdfplumber가 페이지를 감지 못하면 page 생략
