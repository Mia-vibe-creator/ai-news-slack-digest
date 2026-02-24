const { runDailyNews } = require('./run');

runDailyNews()
  .then((count) => {
    console.log(`Posted ${count} item(s).`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
