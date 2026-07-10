require('log-timestamp');
const coinUtils = require('./utils.js').utils;
const axios = require('axios');

const WHITELIST_STABLE_COINS = [
  "busd:usd",
  "busd:usd:30",
  "usdt:usd",
  "usdt:usd:30",
  'usdc:usd',
  'usdc:usd:30',
  'dai:usd',
  'dai:usd:30'
]
const UNLISTED_COINS = ["ust:usd", "ust:usd:30"]

var getCoinGeckoPrice = async (marketID) => {
  if (WHITELIST_STABLE_COINS.indexOf(marketID) > -1 ) {
    return 1.0
  }

  if (isUnlistedMarket(marketID)) {
    return 0
  }

  try {
    var url = coinUtils.loadCoinGeckoQuery(marketID);
  } catch (e) {
    throw new Error(`could not load ${marketID} query from coin-gecko`);
  }
  try {
    var priceFetch = await axios.get(url);
  } catch (e) {
    console.log(e);
    throw new Error(`could not fetch ${marketID} price from coin-gecko`);
  }
  try {
    const proposedPrice = coinUtils.postProcessCoinGeckoPrice(
      marketID,
      priceFetch.data
    );
    if (!proposedPrice) {
      throw new Error(`could not post-process ${marketID} price from coin-gecko`);
    }
    return proposedPrice;
  } catch (e) {
    console.log(e);
    console.log(`failure to post-process coin-gecko price request for ${marketID}
    data: ${priceFetch.data}`);
    throw new Error(`could not post-process ${marketID} price from coin-gecko`);
  }
};

var getBinancePrice = async (marketID) => {
  if (WHITELIST_STABLE_COINS.indexOf(marketID) > -1 ) {
    return 1.0
  }

  if (isUnlistedMarket(marketID)) {
    return 0
  }

  try {
    var url = coinUtils.loadBinanceQuery(marketID);
  } catch (e) {
    console.log(e);
    throw new Error(`could not load ${marketID} query from binance`)
  }
  try {
    var priceFetch = await axios.get(url);
  } catch (e) {
    console.log(e);
    throw new Error(`could not fetch ${marketID} price from binance`)
  }
  try {
    const proposedPrice = coinUtils.postProcessBinancePrice(
      marketID,
      priceFetch.data
    );
    if (!proposedPrice) {
      throw new Error(`could not post-process ${marketID} price from binance`)
    }
    return proposedPrice;
  } catch (e) {
    console.log(e);
    console.log(`failure to post-process binance price request for ${marketID}
    data: ${priceFetch.data}`);
    throw new Error(`could not post-process ${marketID} price from binance`)
  }
  // return priceFetch.data.lastPrice
};

var getKuCoinPrice = async (marketID) => {
  try {
    var url = coinUtils.loadKuCoinQuery(marketID)
  } catch (e) {
    throw new Error(`could not load ${marketID} query from kucoin`)
  }
  try {
    var priceFetch = await axios.get(url)
  } catch(e) {
    console.log(e)
    throw new Error(`could not fetch ${marketID} price from kucoin`)
  }
  try {
    const proposedPrice = coinUtils.postProcessKuCoinPrice(
      marketID,
      priceFetch.data.data,
    )
    if (!proposedPrice) {
      throw new Error(`could not post-process ${marketID} from kucoin`)
    }
    return proposedPrice
  } catch (e) {
    console.log(e)
    console.log(`failure to post-process kucoin price request for ${marketID}
    data: ${priceFetch.data}`)
    throw new Error(`could not post-process ${marketID} price for kucoin`)
  }
}

function isUnlistedMarket(marketID) {
  return UNLISTED_COINS.indexOf(marketID) > -1
}

module.exports.prices = {
  getBinancePrice,
  getCoinGeckoPrice,
  getKuCoinPrice,
  isUnlistedMarket,
};
