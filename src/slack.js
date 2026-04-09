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

function buildSummarySection(title, lines) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: [`*${title}*`, ...lines].join('\n')
    }
  };
}

function stripLeadingLabel(text) {
  return String(text || '')
    .replace(/^\s*(要約|学び|活用|PM活用観点|戦略的活用|提案観点|確信度|情報確度|確度|5W1H|ファクト)\s*[:：]\s*/u, '')
    .trim();
}

function buildConceptSection(concept, index) {
  return buildSummarySection(`概念 ${index + 1}`, [
    `*${concept.title}*`,
    `領域: ${concept.domain} | 重要度: ${concept.popularity}`,
    concept.description,
    `なぜ重要か: ${concept.importance}`,
    `仕事でどう使うか: ${concept.workUse}`,
    `混同しやすい点: ${concept.related}`,
    `クライアントへの説明例: ${concept.clientTalk}`
  ]);
}

function buildConceptBlocks(concepts) {
  const sections = concepts.flatMap((concept, index) => [
    buildConceptSection(concept, index),
    { type: 'divider' }
  ]);

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*AI / IT / UIUX 概念学習ブリーフ*\n${formatDateJst(new Date())} の学習テーマ`
      }
    },
    { type: 'divider' },
    buildSummarySection('今日の狙い', [
      'ネット上で頻出し、実務でよく使われる概念を2つずつ学習します。',
      'AI / IT / UIUXを横断して、提案・要件定義・運用で必要な言葉を固めます。'
    ]),
    { type: 'divider' },
    ...sections.slice(0, -1)
  ];
}

function buildNewsBlocks(brief) {
  if (!brief || !brief.items || brief.items.length === 0) {
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

  const header = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*生成AI PMデイリーブリーフ*\n${formatDateJst(new Date())} のニュース学習`
    }
  };

  const itemSections = brief.items.slice(0, 3).flatMap((item, index) => [
    buildSummarySection(`ニュース ${index + 1}`, [
      `*<${item.link}|${item.title}>*`,
      `出典: ${item.source || '不明'} | カテゴリ: ${item.topic || 'その他'}`,
      `*🧭 情報確度:* [${stripLeadingLabel(item.confidenceLevel || '中')}] ${stripLeadingLabel(item.confidenceReason || '主要メディア報道だが一次情報の確認余地あり')}`,
      `*🧩 5W1H:* ${stripLeadingLabel(item.keyFacts || '誰が: 不明 / いつ: 不明 / 何を: 不明 / どうやって: 不明 / 結果: 不明')}`,
      `*📌 要約:* ${stripLeadingLabel(item.summary)}`,
      `*💡 学び:* ${stripLeadingLabel(item.learning)}`,
      `*📊 戦略的活用:* ${stripLeadingLabel(item.pmUse)}`
    ]),
    { type: 'divider' }
  ]);

  return [header, { type: 'divider' }, ...itemSections.slice(0, -1)];
}

async function postMessage({ blocks, text }) {
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
      text,
      blocks,
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

async function postToSlack(newsItems) {
  return postMessage({
    text: '生成AI PMデイリーブリーフ',
    blocks: buildNewsBlocks(newsItems)
  });
}

async function postConceptToSlack(concepts) {
  return postMessage({
    text: 'AI / IT / UIUX 概念学習ブリーフ',
    blocks: buildConceptBlocks(concepts)
  });
}

module.exports = {
  buildConceptBlocks,
  buildNewsBlocks,
  postConceptToSlack,
  postToSlack
};
