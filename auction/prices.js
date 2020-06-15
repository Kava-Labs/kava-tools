const CoinGecko = require('coingecko-api');
const axios = require('axios');

const BINANCE_API_TICKER = 'https://api.binance.com/api/v3/ticker/24hr?symbol=';

const getMarketCoinGecko = (denom) => {
  switch (denom) {
    case 'xrp':
      return 'ripple';
    case 'bnb':
      return 'binancecoin';
    case 'btc':
      return 'bitcoin';
    case 'atom':
      return 'cosmos';
    case 'kava':
      return 'kava';
    default:
      throw `invalid denom ${denom}`;
  }
};

const getMarketBinance = (denom) => {
  switch (denom) {
    case 'bnb':
      return 'BNBUSDT';
    case 'xrp':
      return 'XRPUSDT';
    case 'btc':
      return 'BTCUSDT';
    case 'kava':
      return 'KAVAUSDT';
    case 'atom':
      return 'ATOMUSDT';
    default:
      throw `invalid denom ${denom}`;
  }
};

var getCoinGeckoPrice = async (denom) => {
  const CoinGeckoClient = new CoinGecko();
  try {
    var market = getMarketCoinGecko(denom);
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${denom} price from coin-gecko`);
    return;
  }
  try {
    var priceFetch = await CoinGeckoClient.simple.price({
      ids: market,
      vs_currencies: ['usd'],
    });
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${denom} price from coin-gecko`);
    return;
  }
  return priceFetch.data[market].usd;
};

var getBinancePrice = async (denom) => {
  try {
    var market = getMarketBinance(denom);
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${denom} price from binance`);
  }
  try {
    const queryUrl = BINANCE_API_TICKER + market;
    var priceFetch = await axios.get(queryUrl);
  } catch (e) {
    console.log(e);
    console.log(`could not fetch ${denom} price from binance`);
  }
  return priceFetch.data.lastPrice;
};

var getPrice = async (denom) => {
  try {
    var price = await getBinancePrice(denom);
  } catch (e) {
    try {
      var price = await getCoinGeckoPrice(denom);
    } catch (e) {
      throw 'could not fetch price from binance, coinGecko';
    }
  }
  return Number.parseFloat(price);
};

exports.getPrice = getPrice;
