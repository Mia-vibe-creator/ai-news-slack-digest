const { XMLParser } = require('fast-xml-parser');

const DEFAULT_QUERIES = [
  '生成AI 活用事例',
  '生成AI 導入事例 企業',
  'LLM セキュリティ',
  '生成AI ガバナンス',
  'AI規制',
  'RAG エージェント'
];

const TOPIC_RULES = [
  { label: 'セキュリティ', keywords: ['セキュリティ', '脆弱性', '漏えい', '対策', '認証', '監査', 'リスク'] },
  { label: '規制・ガバナンス', keywords: ['規制', '法', 'ガイドライン', 'ガバナンス', 'ポリシー', 'コンプライアンス', '管理', '統制', '契約'] },
  { label: 'ユースケース', keywords: ['活用', '導入', '事例', '業務', '効果', '生産性', '連携', '改善', '最適化'] },
  { label: '技術アップデート', keywords: ['モデル', 'LLM', 'RAG', 'エージェント', '推論', 'API', 'プラットフォーム', 'エンタープライズ'] },
  { label: '市場トレンド', keywords: ['資金調達', '提携', '買収', '発表', '戦略', '競争', 'カンファレンス', 'イベント'] }
];

const PRIORITY_KEYWORDS = [
  'セキュリティ',
  '規制',
  'ガバナンス',
  '導入',
  '事例',
  'ROI',
  '運用',
  '監査',
  'AIエージェント',
  'RAG'
];

function countMatches(text, keywords) {
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
}

function detectTopic(text) {
  const best = TOPIC_RULES
    .map((rule) => ({ ...rule, score: countMatches(text, rule.keywords) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score === 0) {
    return 'その他';
  }

  return best.label;
}

function buildPmInsight(topic) {
  if (topic === 'セキュリティ') {
    return '提案観点: 導入時のリスク評価とガードレール設計に直結';
  }
  if (topic === '規制・ガバナンス') {
    return '提案観点: クライアント向け運用ルール/統制設計の根拠になる';
  }
  if (topic === 'ユースケース') {
    return '提案観点: 提案資料の業界別ユースケースとして再利用可能';
  }
  if (topic === '技術アップデート') {
    return '提案観点: 実装方式やPoC構成の選定材料になる';
  }
  if (topic === '市場トレンド') {
    return '提案観点: 競合比較と投資優先度の判断に使える';
  }
  return '提案観点: 追加調査の候補としてウォッチ';
}

function buildPmLearn(topic) {
  if (topic === 'セキュリティ') {
    return '学び: 生成AI導入時のリスクと対策パターンを把握';
  }
  if (topic === '規制・ガバナンス') {
    return '学び: 法規制や社内統制の要求事項を整理';
  }
  if (topic === 'ユースケース') {
    return '学び: 業界別の効果指標と適用領域を理解';
  }
  if (topic === '技術アップデート') {
    return '学び: 最新アーキ/運用の前提をアップデート';
  }
  if (topic === '市場トレンド') {
    return '学び: 競合状況と投資トレンドを把握';
  }
  return '学び: 周辺情報を整理して優先度を判断';
}

function buildPmAction(topic) {
  if (topic === 'セキュリティ') {
    return '活用: 監査対応・データ保護の提案資料に反映';
  }
  if (topic === '規制・ガバナンス') {
    return '活用: クライアント向け運用ガイドラインに落とす';
  }
  if (topic === 'ユースケース') {
    return '活用: ユースケース比較表とROI試算に組み込む';
  }
  if (topic === '技術アップデート') {
    return '活用: PoC設計や要件定義の選定根拠に使う';
  }
  if (topic === '市場トレンド') {
    return '活用: 提案の差別化ポイント整理に使う';
  }
  return '活用: 次回提案の調査タスクに登録';
}

function scoreForPm(text, topic) {
  const priorityScore = countMatches(text, PRIORITY_KEYWORDS) * 2;
  const topicBoost = topic === 'その他' ? 0 : 3;
  return priorityScore + topicBoost;
}

function buildFallbackLearn(summaryText) {
  if (summaryText.includes('リスク') || summaryText.includes('ガバナンス') || summaryText.includes('契約')) {
    return '学び: 生成AI導入では機能比較より先にリスクと統制設計を整理する必要がある';
  }
  if (summaryText.includes('連携') || summaryText.includes('統合') || summaryText.includes('運用')) {
    return '学び: 生成AIの価値は単体機能より既存業務やシステムとのつなぎ込みで決まる';
  }
  if (summaryText.includes('カンファレンス') || summaryText.includes('発表') || summaryText.includes('NVIDIA')) {
    return '学び: 市場の注目テーマから次の提案論点を先回りして押さえる必要がある';
  }
  return '学び: 今日のニュースは導入実務と全体設計の両面を理解する材料になる';
}

function buildFallbackAction(summaryText) {
  if (summaryText.includes('リスク') || summaryText.includes('ガバナンス') || summaryText.includes('契約')) {
    return '活用: 提案書にガバナンス、権限管理、監査観点の章を必ず入れる';
  }
  if (summaryText.includes('連携') || summaryText.includes('統合') || summaryText.includes('運用')) {
    return '活用: 業務フロー図の中でAIがどこに接続されるかを可視化して説明する';
  }
  if (summaryText.includes('カンファレンス') || summaryText.includes('発表') || summaryText.includes('NVIDIA')) {
    return '活用: 提案先に関連する技術トレンドを事例スライドとして先に提示する';
  }
  return '活用: ニュースをそのまま共有せず、提案やPoC論点へ翻訳して使う';
}

function buildFallbackInsight(summaryText) {
  if (summaryText.includes('リスク') || summaryText.includes('ガバナンス') || summaryText.includes('契約')) {
    return '提案観点: 安全に導入できる運用条件まで示して初めてクライアントは意思決定しやすい';
  }
  if (summaryText.includes('連携') || summaryText.includes('統合') || summaryText.includes('運用')) {
    return '提案観点: AI単体の精度ではなく、既存システムとの接続後の業務価値を語るべき';
  }
  if (summaryText.includes('カンファレンス') || summaryText.includes('発表') || summaryText.includes('NVIDIA')) {
    return '提案観点: 市場の話題を顧客課題と結び付けて、実行可能な論点に落とし込む必要がある';
  }
  return '提案観点: 今日の話題を業務価値と実行条件に言い換えて提示する';
}

function getQueriesFromEnv() {
  const value = process.env.QUERY_TERMS;
  if (!value) {
    return DEFAULT_QUERIES;
  }

  const parsed = value
    .split(',')
    .map((q) => q.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_QUERIES;
}

function buildGoogleNewsRssUrl(query) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}+when:1d&hl=ja&gl=JP&ceid=JP:ja`;
}

function normalizeToArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function stripHtml(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text, maxLength = 140) {
  if (!text) {
    return '要約なし';
  }

  const cleaned = stripHtml(text);
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function normalizeItem(item) {
  const sourceValue = item.source;
  const source =
    typeof sourceValue === 'string'
      ? sourceValue
      : sourceValue && typeof sourceValue === 'object'
        ? sourceValue['#text'] || sourceValue.text || ''
        : '';

  const date = new Date(item.pubDate || item.isoDate || Date.now());

  const fullText = [item.title || '', item.description || '', source || ''].join(' ');
  const topic = detectTopic(fullText);
  const summary = summarize(item.description || item.content || '');
  const learn = topic === 'その他' ? buildFallbackLearn(fullText) : buildPmLearn(topic);
  const action = topic === 'その他' ? buildFallbackAction(fullText) : buildPmAction(topic);
  const insight = topic === 'その他' ? buildFallbackInsight(fullText) : buildPmInsight(topic);

  return {
    title: String(item.title || '').trim(),
    link: String(item.link || '').trim(),
    source: String(source || '').trim(),
    pubDate: Number.isNaN(date.getTime()) ? new Date() : date,
    summary,
    topic,
    insight,
    learn,
    action,
    relevanceScore: scoreForPm(fullText, topic)
  };
}

function isWithinHours(date, hours) {
  const now = Date.now();
  const diff = now - date.getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

async function fetchRssItems(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true
  });

  const parsed = parser.parse(xml);
  const items = normalizeToArray(parsed?.rss?.channel?.item);
  return items.map(normalizeItem);
}

async function collectLatestNews(maxItems) {
  const queries = getQueriesFromEnv();
  const urls = queries.map(buildGoogleNewsRssUrl);

  const allResults = await Promise.allSettled(urls.map((url) => fetchRssItems(url)));

  const merged = allResults
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((item) => item.title && item.link)
    .filter((item) => isWithinHours(item.pubDate, 24));

  const uniqueByLink = new Map();
  for (const item of merged) {
    if (!uniqueByLink.has(item.link)) {
      uniqueByLink.set(item.link, item);
    }
  }

  const deduped = [...uniqueByLink.values()].sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.pubDate - a.pubDate;
  });

  return deduped.slice(0, maxItems);
}

module.exports = {
  collectLatestNews
};
