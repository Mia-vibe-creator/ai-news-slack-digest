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

function uniqueNonEmpty(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildThemeSummary(newsItems) {
  const topics = uniqueNonEmpty(newsItems.map((item) => item.topic)).slice(0, 3);
  if (topics.length === 0) {
    return '今日は大きな論点が分散しています。';
  }
  if (topics.length === 1) {
    return `今日は「${topics[0]}」が中心です。`;
  }
  return `今日は「${topics.join(' / ')}」が中心です。`;
}

function buildSummarySection(title, lines) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: [`*${title}*`, ...lines].join('\n')
    }
  };
}

function buildNewsBlocks(newsItems) {
  if (newsItems.length === 0) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*生成AI PMデイリーブリーフ*\n本日の新着はありません。'
        }
      }
    ];
  }

  const learnLines = uniqueNonEmpty(newsItems.map((item) => item.learn)).slice(0, 3).map((line) => `- ${line}`);
  const actionLines = uniqueNonEmpty(newsItems.map((item) => item.action)).slice(0, 3).map((line) => `- ${line}`);
  const insightLines = uniqueNonEmpty(newsItems.map((item) => item.insight)).slice(0, 3).map((line) => `- ${line}`);
  const referenceLines = newsItems.slice(0, 3).map((item, index) =>
    `${index + 1}. <${item.link}|${item.title}> (${item.topic || 'その他'} / ${item.source || '不明'})`
  );

  const header = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*生成AI PMデイリーブリーフ*\n${formatDateJst(new Date())} 時点の学習サマリー`
    }
  };

  return [
    header,
    { type: 'divider' },
    buildSummarySection('今日の論点', [buildThemeSummary(newsItems)]),
    { type: 'divider' },
    buildSummarySection('今日学ぶこと', learnLines),
    { type: 'divider' },
    buildSummarySection('仕事での活用', actionLines),
    { type: 'divider' },
    buildSummarySection('提案観点', insightLines),
    { type: 'divider' },
    buildSummarySection('参考ニュース', referenceLines)
  ];
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
      text: '生成AI PMデイリーブリーフ',
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
