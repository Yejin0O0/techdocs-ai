#!/bin/bash
set -e

SCRIPT_DIR="$(dirname "$0")"
VENV="$SCRIPT_DIR/.venv"

if [ ! -d "$VENV" ]; then
  echo "Playwright 환경이 없어요. 먼저 npm run e2e:setup 을 실행해주세요."
  exit 1
fi

exec "$VENV/bin/python" "$SCRIPT_DIR/test_main.py" "$@"
