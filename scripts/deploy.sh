#!/usr/bin/env bash
set -euo pipefail

GCLOUD_BIN="${GCLOUD_BIN:-gcloud}"
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-northeast1}"
TOPIC="${TOPIC:-ai-news-daily}"
FUNCTION_NAME="${FUNCTION_NAME:-daily-ai-news}"
SCHEDULER_NAME="${SCHEDULER_NAME:-daily-ai-news-jst10}"
SLACK_BOT_TOKEN="${SLACK_BOT_TOKEN:-}"
SLACK_CHANNEL="${SLACK_CHANNEL:-}"
MAX_ITEMS="${MAX_ITEMS:-3}"
QUERY_TERMS="${QUERY_TERMS:-生成AI,LLM,大規模言語モデル,OpenAI,Anthropic,Google DeepMind}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "ERROR: PROJECT_ID is required"
  exit 1
fi

if [[ -z "$SLACK_BOT_TOKEN" ]]; then
  echo "ERROR: SLACK_BOT_TOKEN is required"
  exit 1
fi

if [[ -z "$SLACK_CHANNEL" ]]; then
  echo "ERROR: SLACK_CHANNEL is required"
  exit 1
fi

"$GCLOUD_BIN" config set project "$PROJECT_ID"

"$GCLOUD_BIN" services enable \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  pubsub.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com

if ! "$GCLOUD_BIN" pubsub topics describe "$TOPIC" >/dev/null 2>&1; then
  "$GCLOUD_BIN" pubsub topics create "$TOPIC"
fi

if ! "$GCLOUD_BIN" secrets describe SLACK_BOT_TOKEN >/dev/null 2>&1; then
  printf '%s' "$SLACK_BOT_TOKEN" | "$GCLOUD_BIN" secrets create SLACK_BOT_TOKEN --data-file=-
else
  printf '%s' "$SLACK_BOT_TOKEN" | "$GCLOUD_BIN" secrets versions add SLACK_BOT_TOKEN --data-file=-
fi

if ! "$GCLOUD_BIN" secrets describe SLACK_CHANNEL >/dev/null 2>&1; then
  printf '%s' "$SLACK_CHANNEL" | "$GCLOUD_BIN" secrets create SLACK_CHANNEL --data-file=-
else
  printf '%s' "$SLACK_CHANNEL" | "$GCLOUD_BIN" secrets versions add SLACK_CHANNEL --data-file=-
fi

"$GCLOUD_BIN" functions deploy "$FUNCTION_NAME" \
  --gen2 \
  --runtime=nodejs20 \
  --region="$REGION" \
  --source=. \
  --entry-point=dailyAiNews \
  --trigger-topic="$TOPIC" \
  --set-env-vars="MAX_ITEMS=${MAX_ITEMS},QUERY_TERMS=${QUERY_TERMS}" \
  --set-secrets="SLACK_BOT_TOKEN=SLACK_BOT_TOKEN:latest,SLACK_CHANNEL=SLACK_CHANNEL:latest"

if "$GCLOUD_BIN" scheduler jobs describe "$SCHEDULER_NAME" --location="$REGION" >/dev/null 2>&1; then
  "$GCLOUD_BIN" scheduler jobs update pubsub "$SCHEDULER_NAME" \
    --location="$REGION" \
    --schedule="0 10 * * *" \
    --time-zone="Asia/Tokyo" \
    --topic="$TOPIC" \
    --message-body="daily-run"
else
  "$GCLOUD_BIN" scheduler jobs create pubsub "$SCHEDULER_NAME" \
    --location="$REGION" \
    --schedule="0 10 * * *" \
    --time-zone="Asia/Tokyo" \
    --topic="$TOPIC" \
    --message-body="daily-run"
fi

echo "Deployment finished."
