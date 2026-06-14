#!/bin/bash
set -e

VENV_DIR="$(dirname "$0")/.venv"

echo "Playwright 가상환경 생성 중..."
python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install -q -r "$(dirname "$0")/requirements.txt"
"$VENV_DIR/bin/python" -m playwright install chromium
echo "완료. 이제 npm run e2e 로 테스트를 실행할 수 있어요."
