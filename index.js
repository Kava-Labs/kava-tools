const PriceOracle = require("./oracle/oracle").PriceOracle;
const AuctionBot = require("./auction/auction").AuctionBot
const RefundBot = require("./refund/refund").RefundBot;
const DeputyWatcher = require("./deputy-watcher/watcher").DeputyWatcher;

module.exports = {
  PriceOracle,
  AuctionBot,
  RefundBot,
  DeputyWatcher,
};
