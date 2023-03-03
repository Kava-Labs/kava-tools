const dotenv = require('dotenv');
dotenv.config();

const AuctionBot = require('..').AuctionBot;

var main = async () => {

  const lcd_url =  process.env.LCD_URL
  const mnemonic =  process.env.MNEMONIC
  const auction_types =  process.env.AUCTION_TYPES
  const ignored_addresses =  process.env.IGNORED_ADDRESSES
  const collaterals =  process.env.COLLATERALS
  const initial_bid_forward =  process.env.INITIAL_BID_FORWARD
  const forward_bid_max =  process.env.FORWARD_BID_MAX
  const forward_bid_margin =  process.env.FORWARD_BID_MARGIN
  const reverse_bid_margin =  process.env.REVERSE_BID_MARGIN
  const crontab =  process.env.CRONTAB


  auctionBot = new AuctionBot(
    lcd_url,
    mnemonic,
    auction_types,
    ignored_addresses,
    collaterals,
    initial_bid_forward,
    forward_bid_max,
    forward_bid_margin,
    reverse_bid_margin,
    crontab
  );
  await auctionBot.initClient();
  await auctionBot.run();
};

main();
