function buildRuleBasedBrief(newsItems) {
  return {
    items: newsItems.slice(0, 1).map((item) => ({
      ...inferConfidence(item),
      title: item.title,
      link: item.link,
      source: item.source || '不明',
      topic: item.topic || 'その他',
      point: buildFallbackSummary(item),
      marketLearning: item.learn || '市場全体では導入条件の明確化と運用標準化が進み、比較検討の軸が実装容易性へシフトしている。',
      consultUse: item.action || 'クライアント提案では、導入効果だけでなく運用条件とリスク統制を同時提示する。'
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

      const sourceSummary = cleanField(sourceItem.summary, 180);
      const pointCandidate = cleanField(entry.point || entry.summaryJa || '', 60);
      const point = chooseSummary(pointCandidate, sourceItem.title, sourceSummary, sourceItem);
      const fallbackConfidence = inferConfidence(sourceItem);
      const confidenceLevel = normalizeConfidenceLevel(entry.confidenceLevel || fallbackConfidence.confidenceLevel);
      const confidenceReason =
        cleanField(stripKnownLabel(entry.confidenceReason), 80) ||
        fallbackConfidence.confidenceReason;
      const marketLearning =
        cleanField(stripKnownLabel(entry.marketLearning || entry.learning), 300) ||
        cleanField(stripKnownLabel(sourceItem.learn), 300) ||
        '市場全体では導入条件の明確化と運用標準化が進み、比較検討の軸が実装容易性へシフトしている。';
      const consultUse =
        cleanField(stripKnownLabel(entry.consultUse || entry.pmUse), 300) ||
        cleanField(stripKnownLabel(sourceItem.action), 300) ||
        'クライアント提案では、導入効果だけでなく運用条件とリスク統制を同時提示する。';

      const fixedMarketLearning = isGenericStatement(marketLearning)
        ? buildMarketLearningFallback(sourceItem)
        : marketLearning;
      const fixedConsultUse = isGenericStatement(consultUse)
        ? buildConsultUseFallback(sourceItem)
        : consultUse;

      return {
        title: cleanField(entry.titleJa, 200) || sourceItem.title,
        link: sourceItem.link,
        source: sourceItem.source || '不明',
        topic: sourceItem.topic || 'その他',
        confidenceLevel,
        confidenceReason,
        point,
        marketLearning: fixedMarketLearning,
        consultUse: fixedConsultUse
      };
    })
    .filter(Boolean)
    .slice(0, 1);
}

function stripKnownLabel(text) {
  return String(text || '')
    .replace(/^\s*(要約|要点|学び|市場の学び|市場の学び（トレンド）|活用|コンサル活用|コンサル活用（具体策）|PM活用観点|提案観点|確信度|情報確度|確度)\s*[:：]\s*/u, '')
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

function looksTooAbstract(text) {
  const normalized = cleanField(text);
  if (!normalized || normalized.length < 18) {
    return true;
  }
  return /(中心です|話題です|注目です|分散しています|重要です|です。)$/u.test(normalized);
}

function hasMetaReportingTone(text) {
  const normalized = cleanField(text);
  return /(報道|記事|ニュース|メディア|取材|～を公開|を公開した)/u.test(normalized);
}

function isGenericStatement(text) {
  const normalized = cleanField(text);
  if (!normalized || normalized.length < 25) {
    return true;
  }
  return /(重要|必要|進んでいる|有効|理解|把握|整理|反映|活用する)$/u.test(normalized);
}

function formatDateJstShort(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '不明';
  }
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function chooseSummary(candidate, title, fallback, sourceItem) {
  const narrativeFallback = buildFallbackSummary(sourceItem);

  if (!candidate) {
    return narrativeFallback;
  }

  const normalizedSummary = normalizeForCompare(candidate);
  const normalizedTitle = normalizeForCompare(title);
  const looksLikeTitleRepeat = normalizedTitle && (
    normalizedSummary === normalizedTitle ||
    normalizedSummary.startsWith(normalizedTitle) ||
    normalizedTitle.startsWith(normalizedSummary)
  );

  const fallbackLooksWeak = !fallback || normalizeForCompare(fallback) === normalizedTitle || looksTooAbstract(fallback);
  if (looksLikeTitleRepeat || looksTooAbstract(candidate) || hasMetaReportingTone(candidate)) {
    return fallbackLooksWeak ? narrativeFallback : fallback;
  }

  return cleanField(candidate, 60);
}

function buildFallbackSummary(sourceItem) {
  const what = cleanField(sourceItem?.title, 120) || 'AI関連動向';
  const topic = sourceItem?.topic || 'その他';
  const summary = cleanField(sourceItem?.summary, 180);
  const core = summary && summary !== what ? summary : what;
  return cleanField(`運用方針が更新され、${core}により実務への適用判断が進む。`, 60);
}

function buildMarketLearningFallback(sourceItem) {
  const summary = cleanField(sourceItem?.summary, 140);
  const topic = sourceItem?.topic || 'その他';
  if (summary && summary !== '要約なし') {
    return cleanField(`この動きは${topic}領域で、機能単体ではなく運用条件まで含めた比較が進む兆候。${summary}`, 300);
  }
  return `この動きは${topic}領域で、導入可否の判断軸が「精度」から「運用可能性」へ移っている兆候。`;
}

function buildConsultUseFallback(sourceItem) {
  const topic = sourceItem?.topic || 'その他';
  if (topic === 'セキュリティ') {
    return '提案初回でリスク評価シートを提示し、要件定義前に権限管理・監査ログ要件を確定する。';
  }
  if (topic === '規制・ガバナンス') {
    return '提案書の1ページ目に統制要件を置き、PoC前に利用規程・責任分界点の合意を取る。';
  }
  if (topic === '技術アップデート') {
    return '既存構成との差分を1枚図にし、MCP/RAG等の採用有無をコストと保守性で比較提示する。';
  }
  return '業務フロー図に適用箇所を明記し、導入後90日で測るKPI（工数・品質・売上影響）を先に合意する。';
}

function normalizeConfidenceLevel(value) {
  const text = String(value || '').trim();
  if (['高', '中', '低'].includes(text)) {
    return text;
  }

  if (text === '要検証') {
    return '低';
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
      confidenceLevel: '低',
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
        '【要約の黄金律】タイトルと重複する単語は最小限にし、「何が変わったか」と「何ができるようになったか」に集中する。',
        '要約は60文字以内・1文で作成。メタ情報（例: 〜が報道した、〜の記事によると）は禁止。',
        '自然な文章の中で5W1Hが読み取れること。見出し形式の列挙は禁止。',
        'タイトルにない具体情報を必ず入れ、可能なら数字を1つ以上入れる。数字がない場合は成功/失敗の要因を1つ以上入れる。',
        '要点・市場の学び・コンサル活用の3項目それぞれで、入力テキストにある具体語を最低1つ使う（例: MCP, 80%, 監査, API）。一般論のみは禁止。',
        '市場の学び（トレンド）は、市場全体の変化や競合の動きを具体的に1〜2文で書く。',
        'コンサル活用（具体策）は、特定のクライアント提案・資料・打ち手にどう使うかを具体的に1〜2文で書く。',
        '各ニュースに「確度」を付ける。値は「低」「中」「高」のいずれか。加えて20〜80文字で根拠を書く。',
        '出力は必ず1件のみ。',
        '参考ニュース欄には、英語タイトルなら日本語訳タイトルを返してください。',
        '出力はJSONのみ。推測で事実を足さないでください。',
        'JSON形式: {"items":[{"index":1,"titleJa":"","point":"","marketLearning":"","consultUse":"","confidenceLevel":"","confidenceReason":""}]}'
      ].join('\n'),
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'pm_news_brief',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['items'],
            properties: {
              items: {
                type: 'array',
                minItems: 1,
                maxItems: 1,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: [
                    'index',
                    'titleJa',
                    'point',
                    'marketLearning',
                    'consultUse',
                    'confidenceLevel',
                    'confidenceReason'
                  ],
                  properties: {
                    index: { type: 'integer' },
                    titleJa: { type: 'string' },
                    point: { type: 'string' },
                    marketLearning: { type: 'string' },
                    consultUse: { type: 'string' },
                    confidenceLevel: { type: 'string' },
                    confidenceReason: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`OpenAI API error: ${response.status} ${response.statusText} ${errorBody}`);
    return buildRuleBasedBrief(newsItems);
  }

  try {
    const data = await response.json();
    const rawText =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      '';
    const parsed = JSON.parse(rawText);

    return {
      items: normalizeLlmItems(parsed.items, newsItems)
    };
  } catch (error) {
    console.error('Failed to parse OpenAI response, falling back to rule-based brief.', error);
    return buildRuleBasedBrief(newsItems);
  }
}

module.exports = {
  buildRuleBasedBrief,
  summarizeNewsForPm
};
