function buildRuleBasedBrief(newsItems) {
  return {
    items: newsItems.slice(0, 3).map((item) => ({
      ...inferConfidence(item),
      title: item.title,
      link: item.link,
      source: item.source || '不明',
      topic: item.topic || 'その他',
      summary: cleanField(item.summary, 500),
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

      const sourceSummary = cleanField(sourceItem.summary, 500);
      const summaryCandidate = cleanField(entry.summaryJa || '', 500);
      const summary = chooseSummary(summaryCandidate, sourceItem.title, sourceSummary);
      const fallbackConfidence = inferConfidence(sourceItem);
      const confidenceLevel = normalizeConfidenceLevel(entry.confidenceLevel || fallbackConfidence.confidenceLevel);
      const confidenceReason =
        cleanField(stripKnownLabel(entry.confidenceReason), 80) ||
        fallbackConfidence.confidenceReason;

      return {
        title: cleanField(entry.titleJa, 200) || sourceItem.title,
        link: sourceItem.link,
        source: sourceItem.source || '不明',
        topic: sourceItem.topic || 'その他',
        confidenceLevel,
        confidenceReason,
        summary,
        learning:
          cleanField(stripKnownLabel(entry.learning), 300) ||
          cleanField(stripKnownLabel(sourceItem.learn), 300) ||
          'このニュースから重要ポイントを整理する',
        pmUse:
          cleanField(stripKnownLabel(entry.pmUse), 300) ||
          cleanField(stripKnownLabel(sourceItem.action), 300) ||
          '提案や要件整理に使える論点へ翻訳する'
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function stripKnownLabel(text) {
  return String(text || '')
    .replace(/^\s*(要約|学び|活用|PM活用観点|提案観点|確信度|情報確度|確度)\s*[:：]\s*/u, '')
    .trim();
}

function cleanField(text, maxLength) {
  const cleaned = String(text || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!maxLength || cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function normalizeForCompare(text) {
  return cleanField(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function chooseSummary(candidate, title, fallback) {
  if (!candidate) {
    return fallback;
  }

  const normalizedSummary = normalizeForCompare(candidate);
  const normalizedTitle = normalizeForCompare(title);
  const looksLikeTitleRepeat = normalizedTitle && (
    normalizedSummary === normalizedTitle ||
    normalizedSummary.startsWith(normalizedTitle) ||
    normalizedTitle.startsWith(normalizedSummary)
  );

  if (looksLikeTitleRepeat && fallback) {
    return fallback;
  }

  return candidate;
}

function normalizeConfidenceLevel(value) {
  const text = String(value || '').trim();
  if (['高', '中', '要検証'].includes(text)) {
    return text;
  }

  if (text === '低') {
    return '要検証';
  }

  return '中';
}

function inferConfidence(item) {
  const source = String(item?.source || '');
  const title = String(item?.title || '');
  const summary = String(item?.summary || '');
  const combined = `${source} ${title} ${summary}`;

  if (/PR TIMES|Business Wire|共同通信PRワイヤー/i.test(combined)) {
    return {
      confidenceLevel: '要検証',
      confidenceReason: '企業発表中心のため、一次情報の裏取りを推奨'
    };
  }

  if (/(OpenAI|Anthropic|Google|Microsoft|Meta|NVIDIA|AWS|Hugging Face|GitHub|arXiv|政府|官公庁|金融庁|総務省|経産省|デジタル庁)/i.test(combined)) {
    return {
      confidenceLevel: '高',
      confidenceReason: '一次情報または公式情報に基づく可能性が高い'
    };
  }

  return {
    confidenceLevel: '中',
    confidenceReason: '主要メディア報道だが一次情報の確認余地あり'
  };
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
        '要約はタイトルの言い換えを禁止。タイトルにない具体情報を必ず入れ、可能なら数字を1つ以上入れる。数字がない場合は成功/失敗の要因を1つ以上入れる。',
        '各ニュースごとに、500字以内の要約、学び、PMとしての活用観点を日本語で作成してください。',
        'PM活用観点は、AIコンサル/マーケティングコンサルの実務でどう使うかを書く。特に「提案資料化」「広告運用」「LTV改善」「要件定義」のいずれかに結び付ける。',
        '各ニュースに「情報確度」を付ける。値は「高」「中」「要検証」のいずれか。加えて20〜80文字で根拠を書く。',
        '参考ニュース欄には、英語タイトルなら日本語訳タイトルを返してください。',
        '出力はJSONのみ。推測で事実を足さないでください。',
        'JSON形式: {"items":[{"index":1,"titleJa":"","summaryJa":"","learning":"","pmUse":"","confidenceLevel":"","confidenceReason":""}]}'
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
