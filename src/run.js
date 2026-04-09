const { collectLatestNews } = require('./rss');
const { getDailyConcepts } = require('./concepts');
const { summarizeNewsForPm } = require('./news-brief');
const { postConceptToSlack, postToSlack } = require('./slack');

function parseMaxItems() {
  const value = Number.parseInt(process.env.MAX_ITEMS || '1', 10);
  if (Number.isNaN(value) || value <= 0) {
    return 1;
  }

  return Math.min(value, 5);
}

async function runDailyNews() {
  const maxItems = parseMaxItems();
  const newsItems = await collectLatestNews(maxItems);
  const brief = await summarizeNewsForPm(newsItems);
  await postToSlack(brief);
  return newsItems.length;
}

async function runDailyConcept() {
  const concepts = getDailyConcepts();
  await postConceptToSlack(concepts);
  return concepts.map((concept) => concept.title).join(', ');
}

module.exports = {
  runDailyConcept,
  runDailyNews
};
