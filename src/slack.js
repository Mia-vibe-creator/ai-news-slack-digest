function formatDateJst(date) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function buildNewsBlocks(newsItems) {
  if (newsItems.length === 0) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*AIニュース速報*\n本日の新着はありません。'
        }
      }
    ];
  }

  const header = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*AIニュース速報*\n${formatDateJst(new Date())} 時点の最新 ${newsItems.length} 件`
    }
  };

  const blocks = [header, { type: 'divider' }];

  for (const item of newsItems) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*<${item.link}|${item.title}>*`,
          `出典: ${item.source || '不明'} | 公開: ${formatDateJst(item.pubDate)} JST`,
          `${item.summary}`
        ].join('\n')
      }
    });

    blocks.push({ type: 'divider' });
  }

  return blocks;
}

async function postToSlack(newsItems) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL;

  if (!token || !channel) {
    throw new Error('SLACK_BOT_TOKEN and SLACK_CHANNEL are required.');
  }

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      channel,
      text: 'AIニュース速報',
      blocks: buildNewsBlocks(newsItems),
      unfurl_links: false,
      unfurl_media: false
    })
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Slack API error: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

module.exports = {
  buildNewsBlocks,
  postToSlack
};
