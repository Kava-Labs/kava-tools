require('dotenv').config({ path: process.env.ENV_FILE });
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
  let feeAmount = process.env.FEE;
  let fee = { amount: [], gas: String(150000) };
  let legacyHDPath = false;
  if (process.env.LEGACY_HD_PATH === 'true') {
    legacyHDPath = true;
  }
  if (feeAmount !== '') {
    fee = {
      amount: [{ denom: 'ukava', amount: feeAmount }],
      gas: String(150000),
    };
  }

  // Initiate price oracle
  oracle = new PriceOracle(marketIDs, expiry, expiryThreshold, deviation, fee);
  await oracle.initClient(lcdURL, mnemonic, legacyHDPath);

  // Start cron job
  cron.schedule(process.env.CRONTAB, () => {
    oracle.postPrices();
  });
};

main();
