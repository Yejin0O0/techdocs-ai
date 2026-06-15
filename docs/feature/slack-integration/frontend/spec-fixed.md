# Slack 연동 — Frontend Spec Fixed

## 기능 개요

사이드바 "파일 목록" 탭 하단에 Slack 봇 사용 방법을 안내하는 정적 컴포넌트를 추가한다. 설정/입력 UI는 없다.

---

## 컴포넌트

### `SlackSettings.tsx`

- 위치: `app/components/upload/SlackSettings.tsx`
- 역할: Slack 봇 사용 방법 3단계 안내 (정적 콘텐츠)
- 상태 없음, props 없음

```
1. 원하는 채널에 TechDocs AI 봇을 초대하세요
2. 채널에서 @TechDocs AI [질문] 형식으로 멘션하세요
3. 인덱싱된 문서를 기반으로 스레드에 답변이 달려요
```

---

## 레이아웃

`page.tsx` "파일 목록" 탭:

```
FileUploader
─────────────
GithubInput
─────────────
SlackSettings   ← 추가
─────────────
FileList
```

---

## 결정: 설정 UI 없이 안내만

토큰 입력 UI를 넣지 않은 이유:

- 토큰은 서버 환경변수(`SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`)로 관리
- 런타임에 토큰을 프론트에서 변경할 요구사항 없음
- 안내만으로 사용자가 봇을 사용하기에 충분
