const { collectLatestNews } = require('./rss');
const { getDailyConcepts } = require('./concepts');
const { postConceptToSlack, postToSlack } = require('./slack');

function parseMaxItems() {
  const value = Number.parseInt(process.env.MAX_ITEMS || '3', 10);
  if (Number.isNaN(value) || value <= 0) {
    return 3;
  }

  return Math.min(value, 20);
}

async function runDailyNews() {
  const maxItems = parseMaxItems();
  const newsItems = await collectLatestNews(maxItems);
  await postToSlack(newsItems);
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
