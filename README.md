# Daily AI PM Brief to Slack (GitHub Actions)

Google News RSS from Japanese generative-AI topics is collected and posted to Slack for PM-focused learning.

## Architecture

- GitHub Actions schedule (`10:03 JST` and `13:03 JST` daily)
- Node.js script (`npm run send`)
- Slack Bot (`chat.postMessage`)

## What is optimized for PM use

- Prioritizes security, governance/regulation, use cases, and implementation topics
- Tags each item with a category
- Adds one-line proposal insight for client work

## Prerequisites

- GitHub repository
- Node.js 20+ (for local test)
- Slack app with bot token and `chat:write`

## Environment Variables

Use `.env.example` as reference:

- `SLACK_BOT_TOKEN`: Bot token (`xoxb-...`)
- `SLACK_CHANNEL`: channel ID (`C...`)
- `MAX_ITEMS`: default `3`
- `QUERY_TERMS`: comma-separated query terms

## Local run

```bash
npm install
export $(cat .env | xargs)
npm run send
```

## GitHub Actions setup

Create repository secrets:

- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL`

Optional repository variables:

- `MAX_ITEMS` (default `3`)
- `QUERY_TERMS` (default: `生成AI 活用事例,生成AI 導入事例 企業,LLM セキュリティ,生成AI ガバナンス,AI規制,RAG エージェント`)

Workflow file:

- `.github/workflows/daily-ai-news.yml`

## Run once manually

- Open GitHub repository
- `Actions` tab
- `Daily AI News`
- Click `Run workflow`

## Notes

- If no new articles in the past 24 hours are found, it posts a fallback message.
- Duplicate links are removed before posting.
- If Google News RSS fetch fails for some queries, successful queries are still used.
