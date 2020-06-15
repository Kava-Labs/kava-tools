const {
  lcd_url,
  mnemonic,
  auction_types,
  ignored_addresses,
  collaterals,
  initial_bid_forward,
  forward_bid_max,
  forward_bid_margin,
  reverse_bid_margin,
  crontab,
} = require('./config');
const AuctionBot = require('..').AuctionBot;

var main = async () => {
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
