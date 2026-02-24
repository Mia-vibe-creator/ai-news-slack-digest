const functions = require('@google-cloud/functions-framework');
const { runDailyNews } = require('./run');

functions.cloudEvent('dailyAiNews', async () => {
  const count = await runDailyNews();
  console.log(`Posted ${count} item(s) to Slack.`);
});
