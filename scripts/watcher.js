require('dotenv').config({path:'../deputy-watcher/.env'})
const DeputyWatcher = require("..").DeputyWatcher
const cron = require('node-cron');

var main = async () => {
  const cronTimer = process.env.CRONTAB;
  const bnbChainLcdURL = process.env.BINANCE_CHAIN_LCD_URL;
  const bnbChainMnemonic = process.env.BINANCE_CHAIN_MNEMONIC;
  const bnbChainDeputy = process.env.BINANCE_CHAIN_DEPUTY_ADDRESS;

  deputyWatcher = new DeputyWatcher(0.00375, bnbChainDeputy)
  await deputyWatcher.initBnbChainClient(bnbChainLcdURL, bnbChainMnemonic, "mainnet");

  // Start cron job
  cron.schedule(cronTimer, () => {
    deputyWatcher.refillDeputy()
  });
}

main();