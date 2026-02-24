#!/usr/bin/env bash
set -euo pipefail

GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
PROJECT_ID="${PROJECT_ID:-}"
TOPIC="${TOPIC:-ai-news-daily}"

if [[ -n "$PROJECT_ID" ]]; then
  "$GCLOUD_BIN" config set project "$PROJECT_ID" >/dev/null
fi

"$GCLOUD_BIN" pubsub topics publish "$TOPIC" --message="manual-test"
