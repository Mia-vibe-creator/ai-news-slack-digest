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
  const topics = uniqueNonEmpty(newsItems.map((item) => item.topic).filter((topic) => topic && topic !== 'その他')).slice(0, 3);
  if (topics.length === 0) {
    const titleText = newsItems.map((item) => item.title).join(' ');
    if (titleText.includes('リスク') || titleText.includes('ガバナンス') || titleText.includes('契約')) {
      return '今日は「AI導入時のリスク管理とガバナンス整備」が中心論点です。';
    }
    if (titleText.includes('連携') || titleText.includes('統合') || titleText.includes('運用')) {
      return '今日は「AIを既存業務やシステムにどう接続するか」が中心論点です。';
    }
    if (titleText.includes('NVIDIA') || titleText.includes('カンファレンス') || titleText.includes('発表')) {
      return '今日は「市場トレンドを踏まえた次の実装テーマ」が中心論点です。';
    }
    return '今日は「生成AIを実務へどう安全に組み込むか」が中心論点です。';
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
  const filledLearnLines = learnLines.length > 0 ? learnLines : ['- 学び: 今日の話題を導入条件、業務価値、運用設計の3視点で読み替える'];
  const filledActionLines = actionLines.length > 0 ? actionLines : ['- 活用: ニュースそのものではなく、提案論点に翻訳して社内メモ化する'];
  const filledInsightLines = insightLines.length > 0 ? insightLines : ['- 提案観点: クライアント課題と実装条件に接続できる情報だけを残す'];

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
    buildSummarySection('今日学ぶこと', filledLearnLines),
    { type: 'divider' },
    buildSummarySection('仕事での活用', filledActionLines),
    { type: 'divider' },
    buildSummarySection('提案観点', filledInsightLines),
    { type: 'divider' },
    buildSummarySection('参考ニュース', referenceLines)
  ];
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
