function buildRuleBasedBrief(newsItems) {
  return {
    items: newsItems.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
      source: item.source || '不明',
      topic: item.topic || 'その他',
      summary: item.summary,
      learning: item.learn || 'このニュースを導入条件、業務価値、運用設計の観点で読み替える',
      pmUse: item.action || '提案論点へ翻訳して、要件定義や提案資料に反映する'
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

function normalizeLlmItems(parsedItems, newsItems) {
  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    return buildRuleBasedBrief(newsItems).items;
  }

  return parsedItems
    .map((entry) => {
      const index = Number.parseInt(entry.index, 10) - 1;
      const sourceItem = newsItems[index];
      if (!sourceItem) {
        return null;
      }

      return {
        title: entry.titleJa || sourceItem.title,
        link: sourceItem.link,
        source: sourceItem.source || '不明',
        topic: sourceItem.topic || 'その他',
        summary: entry.summaryJa || sourceItem.summary,
        learning: entry.learning || sourceItem.learn || 'このニュースから重要ポイントを整理する',
        pmUse: entry.pmUse || sourceItem.action || '提案や要件整理に使える論点へ翻訳する'
      };
    })
    .filter(Boolean)
    .slice(0, 3);
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
        '入力に英語のタイトルや要約が含まれる場合は、まず自然な日本語へ翻訳してから解釈してください。',
        '各ニュースごとに、500字以内の要約、学び、PMとしての活用観点を日本語で作成してください。',
        '参考ニュース欄には、英語タイトルなら日本語訳タイトルを返してください。',
        '出力はJSONのみ。推測で事実を足さないでください。',
        'JSON形式: {"items":[{"index":1,"titleJa":"","summaryJa":"","learning":"","pmUse":""}]}'
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
    items: normalizeLlmItems(parsed.items, newsItems)
  };
}

module.exports = {
  buildRuleBasedBrief,
  summarizeNewsForPm
};
