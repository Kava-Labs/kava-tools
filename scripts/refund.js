require('dotenv').config({path:'../refund/.env'})
const RefundBot = require("..").RefundBot
const cron = require('node-cron');

var main = async () => {
  // Load environment variables
  const cronTimer = process.env.CRONTAB;
  const kavaLcdURL = process.env.KAVA_LCD_URL;
  const kavaMnemonic = process.env.KAVA_MNEMONIC;
  const bnbChainLcdURL = process.env.BINANCE_CHAIN_LCD_URL;
  const bnbChainMnemonic = process.env.BINANCE_CHAIN_MNEMONIC;
  const bnbChainDeputy = process.env.BINANCE_CHAIN_DEPUTY_ADDRESS;

  // Initiate refund bot
  refundBot = new RefundBot(bnbChainDeputy);
  await refundBot.initKavaClient(kavaLcdURL, kavaMnemonic);
  await refundBot.initBnbChainClient(bnbChainLcdURL, bnbChainMnemonic);

  // Start cron job
  cron.schedule(cronTimer, () => {
    refundBot.refundSwaps()
  });

  // Print Binance Chain offsets hourly for debugging and future optimization.
  cron.schedule("* 1 * * *", () => {
    refundBot.printOffsets()
  });
}

main();