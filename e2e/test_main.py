"""
TechDocs AI E2E 테스트

사전 조건:
  - npm run dev (프론트, 포트 3000)
  - 백엔드 uvicorn (포트 8000)
  - 문서가 최소 1개 이상 업로드되어 있어야 함

실행:
  npm run e2e          # headless (CI용)
  npm run e2e:headed   # 브라우저 직접 확인
"""

import os
import sys
import time

from playwright.sync_api import sync_playwright, expect

HEADLESS = os.environ.get("E2E_HEADED", "0") != "1"
BASE_URL = "http://localhost:3000"
QUESTION = "프로그램 개발 순서를 알려줘"


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS, slow_mo=100 if not HEADLESS else 0)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        passed = []
        failed = []

        def ok(label):
            print(f"  ✅ {label}")
            passed.append(label)

        def fail(label, reason=""):
            msg = f"  ❌ {label}" + (f" — {reason}" if reason else "")
            print(msg)
            failed.append(label)

        # ── 1. 앱 로드 ──────────────────────────────────────────────────
        print("\n[1] 앱 로드")
        page.goto(BASE_URL)
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/e2e_01_initial.png")
        ok("앱 로드")

        # ── 2. 파일 목록 ─────────────────────────────────────────────────
        print("\n[2] 파일 목록")
        ready_badges = page.locator("text=준비 완료")
        count = ready_badges.count()
        if count > 0:
            ok(f"준비 완료 문서 {count}개 확인")
        else:
            fail("준비 완료 문서 없음", "문서를 먼저 업로드해주세요")
            browser.close()
            return passed, failed

        # ── 3. 채팅 입력창 ────────────────────────────────────────────────
        print("\n[3] 채팅 입력창")
        chat_input = page.locator("textarea").first
        if not chat_input.is_visible():
            # 모바일 레이아웃: 채팅 탭 클릭
            page.locator("button:has-text('채팅')").first.click()
            page.wait_for_timeout(500)
        chat_input = page.locator("textarea").first
        if chat_input.is_visible():
            ok("채팅 입력창 확인")
        else:
            fail("채팅 입력창 없음")
            browser.close()
            return passed, failed

        # ── 4. 질문 전송 ─────────────────────────────────────────────────
        print("\n[4] 질문 전송")
        chat_input.click()
        chat_input.fill(QUESTION)
        chat_input.press("Enter")
        ok("질문 전송")

        # ── 5. 스트리밍 응답 대기 ─────────────────────────────────────────
        print("\n[5] 스트리밍 응답 대기")
        # 커서 애니메이션(animate-pulse)이 사라질 때까지 대기 (최대 30초)
        try:
            page.wait_for_selector(".animate-pulse", state="detached", timeout=30_000)
            page.wait_for_timeout(500)
            ok("응답 수신 완료")
        except Exception:
            fail("응답 타임아웃")
        page.screenshot(path="/tmp/e2e_05_response.png")

        # ── 6. 출처 뱃지 확인 ─────────────────────────────────────────────
        print("\n[6] 출처 뱃지")
        # SourceBadge는 pdf 아이콘(svg) + 파일명 버튼
        badges = page.locator("[data-slot='badge'], button svg ~ span, .border.rounded-full").all()
        # 더 안정적인 방법: 마지막 assistant 버블 내 버튼들
        assistant_bubble = page.locator(".rounded-2xl").last
        badge_buttons = assistant_bubble.locator("button").all()
        badge_count = len(badge_buttons)

        if badge_count > 0:
            ok(f"출처 뱃지 {badge_count}개 확인")

            # ── 7. 출처 패널 오픈 ─────────────────────────────────────────
            print("\n[7] 출처 패널 오픈")
            badge_buttons[0].click()
            page.wait_for_timeout(1000)
            page.screenshot(path="/tmp/e2e_07_source_panel.png")

            # 패널: Sheet(데스크탑) 또는 Drawer(모바일)
            panel = page.locator("[role='dialog'], [data-vaul-drawer]").first
            if panel.is_visible():
                ok("출처 패널 오픈 확인")
            else:
                fail("출처 패널 미확인", "스크린샷 /tmp/e2e_07_source_panel.png 확인")
        else:
            print("  ℹ️  출처 뱃지 없음 — LLM이 관련 내용을 찾지 못한 케이스 (정상)")

        browser.close()
        return passed, failed


if __name__ == "__main__":
    print("=" * 50)
    print("TechDocs AI E2E 테스트")
    print("=" * 50)
    passed, failed = run()
    print(f"\n결과: {len(passed)}개 통과 / {len(failed)}개 실패")
    if failed:
        print("실패 항목:", ", ".join(failed))
        sys.exit(1)
