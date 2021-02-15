require('log-timestamp');
const coinUtils = require('./utils.js').utils;
const axios = require('axios');

const WHITELIST_STABLE_COINS = ["busd:usd", "busd:usd:30"]

var getCoinGeckoPrice = async (marketID) => {
  if (WHITELIST_STABLE_COINS.indexOf(marketID) > -1 ) {
    return 1.0
  }
  try {
    var url = coinUtils.loadCoinGeckoQuery(marketID);
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${marketID} price from coin-gecko`);
    return;
  }
  try {
    var priceFetch = await axios.get(url);
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${marketID} price from coin-gecko`);
    return;
  }
  try {
    const proposedPrice = coinUtils.postProcessCoinGeckoPrice(
      marketID,
      priceFetch.data
    );
    if (!proposedPrice) {
      console.log(`could not fetch ${marketID} price from coin-gecko`);
      return;
    }
    return proposedPrice;
  } catch (e) {
    console.log(e);
    console.log(`failure to post-process coin-gecko price request for ${marketID}
    data: ${priceFetch.data}`);
    return;
  }
};

var getBinancePrice = async (marketID) => {
  if (WHITELIST_STABLE_COINS.indexOf(marketID) > -1 ) {
    return 1.0
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

var getBitmaxPrice = async (marketID) => {
  try {
    var url = coinUtils.loadBitmaxQuery(marketID)
  } catch (e) {
    throw new Error(`could not load ${marketID} query from bitmax`)
  }
  try {
    var priceFetch = await axios.get(url)
  } catch(e) {
    console.log(e)
    throw new Error(`could not fetch ${marketID} price from bitmax`)
  }
  try {
    const proposedPrice = coinUtils.postProcessBitmaxPrice(
      marketID,
      priceFetch.data.data
    )
    if (!proposedPrice) {
      throw new Error(`could not post-process ${marketID} from bitmax`)
    }
    return proposedPrice
  } catch (e) {
    console.log(e)
    console.log(`failure to post-process bitmax price request for ${marketID}
    data: ${priceFetch.data}`)
    throw new Error(`could not post-process ${marketID} price for bitmax`)
  }
}

module.exports.prices = {
  getBinancePrice,
  getCoinGeckoPrice,
  getBitmaxPrice,
};
