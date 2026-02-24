# Daily AI News to Slack (GitHub Actions)

Google News RSS from Japanese AI topics is collected daily and posted to Slack.

## Architecture

- GitHub Actions schedule (`10:00 JST` daily)
- Node.js script (`npm run send`)
- Slack Bot (`chat.postMessage`)

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
- `QUERY_TERMS` (default: `生成AI,LLM,大規模言語モデル,OpenAI,Anthropic,Google DeepMind`)

Workflow file:

- `.github/workflows/daily-ai-news.yml`

Schedule is set to UTC `01:00` (= JST `10:00`).

## Run once manually

- Open GitHub repository
- `Actions` tab
- `Daily AI News`
- Click `Run workflow`

## Notes

- If no new articles in the past 24 hours are found, it posts a fallback message.
- Duplicate links are removed before posting.
- If Google News RSS fetch fails for some queries, successful queries are still used.
