const { runDailyConcept, runDailyNews } = require('./run');

const mode = process.env.DELIVERY_MODE === 'concept' ? 'concept' : 'news';

const runner = mode === 'concept' ? runDailyConcept : runDailyNews;

runner()
  .then((result) => {
    if (mode === 'concept') {
      console.log(`Posted concept: ${result}.`);
      return;
    }
    console.log(`Posted ${result} item(s).`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
