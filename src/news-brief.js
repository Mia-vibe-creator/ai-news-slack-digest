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

function ensureLines(lines, fallback) {
  return lines.length > 0 ? lines : [fallback];
}

function buildRuleBasedBrief(newsItems) {
  const learnings = ensureLines(
    uniqueNonEmpty(newsItems.map((item) => item.learn)).slice(0, 3),
    '今日の話題を導入条件、業務価値、運用設計の3視点で読み替える'
  );
  const actions = ensureLines(
    uniqueNonEmpty(newsItems.map((item) => item.action)).slice(0, 3),
    'ニュースそのものではなく、提案論点に翻訳して社内メモ化する'
  );
  const proposalInsights = ensureLines(
    uniqueNonEmpty(newsItems.map((item) => item.insight)).slice(0, 3),
    'クライアント課題と実装条件に接続できる情報だけを残す'
  );

  return {
    theme: buildThemeSummary(newsItems),
    learnings,
    actions,
    proposalInsights,
    references: newsItems.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
      source: item.source || '不明',
      topic: item.topic || 'その他'
    }))
  };
}

function buildNewsPrompt(newsItems) {
  return newsItems
    .map((item, index) => [
      `#${index + 1}`,
      `title: ${item.title}`,
      `source: ${item.source || '不明'}`,
      `published: ${item.pubDate.toISOString()}`,
      `topic_hint: ${item.topic || 'その他'}`,
      `summary: ${item.summary}`
    ].join('\n'))
    .join('\n\n');
}

async function summarizeNewsForPm(newsItems) {
  if (newsItems.length === 0) {
    return buildRuleBasedBrief(newsItems);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildRuleBasedBrief(newsItems);
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const prompt = buildNewsPrompt(newsItems);

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      instructions: [
        'あなたは生成AIのコンサルタント兼プロジェクトマネージャー向けのニュース編集者です。',
        '与えられたニュース候補だけを根拠に、日本語で短く、具体的に要約してください。',
        '単なるニュース要約ではなく、PM/提案担当者が今日学ぶべきこと、仕事でどう使うか、提案でどう語るかを抽出してください。',
        '出力はJSONのみ。推測で事実を足さないでください。'
      ].join('\n'),
      input: prompt,
      text: {
        format: {
          type: 'json_object'
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.output_text);

  return {
    theme: parsed.theme || buildThemeSummary(newsItems),
    learnings: Array.isArray(parsed.learnings) && parsed.learnings.length > 0 ? parsed.learnings.slice(0, 3) : buildRuleBasedBrief(newsItems).learnings,
    actions: Array.isArray(parsed.actions) && parsed.actions.length > 0 ? parsed.actions.slice(0, 3) : buildRuleBasedBrief(newsItems).actions,
    proposalInsights:
      Array.isArray(parsed.proposalInsights) && parsed.proposalInsights.length > 0
        ? parsed.proposalInsights.slice(0, 3)
        : buildRuleBasedBrief(newsItems).proposalInsights,
    references: newsItems.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
      source: item.source || '不明',
      topic: item.topic || 'その他'
    }))
  };
}

module.exports = {
  buildRuleBasedBrief,
  summarizeNewsForPm
};
