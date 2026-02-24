const { XMLParser } = require('fast-xml-parser');

const DEFAULT_QUERIES = [
  '生成AI',
  'LLM',
  '大規模言語モデル',
  'OpenAI',
  'Anthropic',
  'Google DeepMind'
];

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

  return {
    title: String(item.title || '').trim(),
    link: String(item.link || '').trim(),
    source: String(source || '').trim(),
    pubDate: Number.isNaN(date.getTime()) ? new Date() : date,
    summary: summarize(item.description || item.content || '')
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

  const deduped = [...uniqueByLink.values()].sort((a, b) => b.pubDate - a.pubDate);

  return deduped.slice(0, maxItems);
}

module.exports = {
  collectLatestNews
};
