#!/usr/bin/env bash

set -euo pipefail

# Guardrail against the Turbopack/PostCSS runaway process bug.
MAX_POSTCSS_WORKERS="${MAX_POSTCSS_WORKERS:-120}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-2}"

cleanup() {
  if [[ -n "${NEXT_PID:-}" ]] && kill -0 "$NEXT_PID" 2>/dev/null; then
    kill "$NEXT_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting Next dev (Turbopack) with RAM guard..."
echo "Guard threshold: ${MAX_POSTCSS_WORKERS} postcss workers"

next dev &
NEXT_PID=$!

while kill -0 "$NEXT_PID" 2>/dev/null; do
  # Count only workers from this repo path.
  worker_count="$(ps -axo command | rg -c "/Users/zerbib/clickup-clone/.next/dev/build/postcss.js" || true)"

  if [[ "${worker_count}" -gt "${MAX_POSTCSS_WORKERS}" ]]; then
    echo ""
    echo "Safety stop: detected ${worker_count} postcss workers (limit: ${MAX_POSTCSS_WORKERS})."
    echo "Stopping dev server to prevent RAM exhaustion."
    kill "$NEXT_PID" 2>/dev/null || true
    pkill -f "/Users/zerbib/clickup-clone/.next/dev/build/postcss.js" 2>/dev/null || true
    exit 1
  fi

  sleep "${CHECK_INTERVAL_SECONDS}"
done

wait "$NEXT_PID"
