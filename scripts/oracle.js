require('dotenv').config();
const PriceOracle = require('..').PriceOracle;
const cron = require('node-cron');

var main = async () => {
  // Load environment variables
  const lcdURL = process.env.LCD_URL;
  const mnemonic = process.env.MNEMONIC;
  const marketIDs = process.env.MARKET_IDS.split(',');
  const expiry = process.env.EXPIRY;
  const expiryThreshold = process.env.EXPIRY_THRESHOLD;
  const deviation = process.env.DEVIATION;

  // Initiate price oracle
  oracle = new PriceOracle(marketIDs, expiry, expiryThreshold, deviation);
  await oracle.initClient(lcdURL, mnemonic);

  // Start cron job
  cron.schedule(process.env.CRONTAB, () => {
    oracle.postPrices();
  });
};

main();
