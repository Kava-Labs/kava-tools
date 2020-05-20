require('log-timestamp');
const CoinGecko = require('coingecko-api');
const coinUtils = require('./utils.js').utils;
const axios = require('axios')

const BINANCE_API_TICKER = 'https://api.binance.com/api/v3/ticker/24hr?symbol='

var getCoinGeckoPrice = async (marketID) => {
  const CoinGeckoClient = new CoinGecko();
  try {
   var market = coinUtils.loadCoinGeckoMarket(marketID);
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${marketID} price from coin-gecko`);
    return;
  }
  try {
    var priceFetch = await CoinGeckoClient.simple.price({
      ids: market,
      vs_currencies: ['usd'],
    });
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${marketID} price from coin-gecko`);
    return;
  }
  return priceFetch.data[market].usd;
};

var getBinancePrice = async (marketID) => {
  try {
    var market = coinUtils.loadBinanceMarket(marketID)
  } catch (e) {
    console.log(e)
    console.log(`could not fetch ${marketID} price from binance`);
  }
  try {
    const queryUrl = BINANCE_API_TICKER + market
    var priceFetch = await axios.get(queryUrl)
  } catch (e) {
    console.log(e)
    console.log(`could not fetch ${marketID} price from binance`)
  }
  return priceFetch.data.lastPrice
}

module.exports.prices = {
  getBinancePrice,
  getCoinGeckoPrice,
}