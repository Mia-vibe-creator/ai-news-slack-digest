# Daily AI PM Brief to Slack (GitHub Actions)

Google News RSS from Japanese generative-AI topics is collected and turned into a PM-focused daily learning brief for Slack.

## Architecture

- GitHub Actions schedule (`10:00 JST` news brief, `14:00 JST` concept brief with 2 concepts)
- Node.js script (`npm run send`)
- Slack Bot (`chat.postMessage`)

## What is optimized for PM use

- Prioritizes security, governance/regulation, use cases, and implementation topics
- Extracts the day's themes instead of sending a long list of links
- Synthesizes what to learn, how to use it at work, and proposal implications
- Sends a separate daily concept brief for AI / IT / UIUX fundamentals you use in client work
- Expands concept coverage beyond your initial list to common, high-frequency industry terms

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
