const util = require('util');

const BINANCE_V3_TICKER_REQUEST = util.format(
  'https://api.binance.com/api/v3/ticker/24hr?symbol=%s'
);
const BINANCE_V3_KLINES_REQUEST = util.format(
  'https://api.binance.com/api/v3/klines?symbol=%s&interval=1m&limit=30'
);
const COINGECKO_V3_MARKET_RANGE_REQUEST = util.format(
  'https://api.coingecko.com/api/v3/coins/%s/market_chart/range?vs_currency=%s&from=%s&to=%s'
);
const COINGECKO_V3_SIMPLE_PRICE_REQUEST = util.format(
  'https://api.coingecko.com/api/v3/simple/price/?ids=%s&vs_currencies=%s'
);

const loadCoinGeckoMarket = (marketID) => {
  switch (marketID) {
    case 'xrp:usd':
      return 'ripple';
    case 'xrp:usd:30':
      return 'ripple';
    case 'bnb:usd':
      return 'binancecoin';
    case 'bnb:usd:30':
      return 'binancecoin';
    case 'btc:usd':
      return 'bitcoin';
    case 'btc:usd:30':
      return 'bitcoin';
    case 'busd:usd':
      return 'binance-usd';
    case 'busd:usd:30':
      return 'binance-usd';
    case 'atom:usd':
      return 'cosmos';
    case 'kava:usd':
      return 'kava';
    case 'kava:usd:30':
      return 'kava';
    case 'hard:usd':
      return 'hard-protocol';
    case 'hard:usd:30':
      return 'hard-protocol';
    default:
      throw `invalid market id ${marketID}`;
  }
};

const loadCoinGeckoQuery = (marketID) => {
  let currentTime = Math.floor(new Date().getTime() * 10 ** -3);
  let past30Minutes = currentTime - 1800;
  switch (marketID) {
    case 'xrp:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'ripple', 'usd');
    case 'xrp:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'ripple',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'bnb:usd':
      return util.format(
        COINGECKO_V3_SIMPLE_PRICE_REQUEST,
        'binancecoin',
        'usd'
      );
    case 'bnb:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'binancecoin',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'btc:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'bitcoin', 'usd');
    case 'btc:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'bitcoin',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'atom:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'cosmos', 'usd');
    case 'kava:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'kava', 'usd');
    case 'kava:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'kava',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'busd:usd':
      return ""
    case 'busd:usd:30':
      return ""
    default:
      throw `invalid market id ${marketID}`;
  }
};

const postProcessCoinGeckoPrice = (marketID, data) => {
  switch (marketID) {
    case 'bnb:usd:30':
      return calculateAveragePriceCoinGecko(data);
    case 'btc:usd:30':
      return calculateAveragePriceCoinGecko(data);
    case 'xrp:usd:30':
      return calculateAveragePriceCoinGecko(data);
    case 'kava:usd:30':
      return calculateAveragePriceCoinGecko(data);
    case 'hard:usd:30':
      return calculateAveragePriceCoinGecko(data);
    default:
      const market = loadCoinGeckoMarket(marketID);
      return data[market].usd;
  }
};

const calculateAveragePriceCoinGecko = (data) => {
  if (!data.prices.length) {
    return 0;
  }
  const prices = data.prices.map((p) => p[1]);
  return prices.reduce((a, b) => a + b, 0) / data.prices.length;
};

const loadBinanceMarket = (marketID) => {
  switch (marketID) {
    case 'bnb:usd':
      return 'BNBUSDT';
    case 'bnb:usd:30':
      return 'BNBUSDT';
    case 'busd:usd':
      return 'BUSDUSDT';
    case 'busd:usd:30':
      return 'BUSDUSDT';
    case 'xrp:usd':
      return 'XRPUSDT';
    case 'xrp:usd:30':
      return 'XRPUSDT';
    case 'btc:usd':
      return 'BTCUSDT';
    case 'btc:usd:30':
      return 'BTCUSDT';
    case 'kava:usd':
      return 'KAVAUSDT';
    case 'kava:usd:30':
      return 'KAVAUSDT';
    case 'hard:usd':
      return 'HARDUSDT';
    case 'hard:usd:30':
      return 'HARDUSDT';
    case 'atom:usd':
      return 'ATOMUSDT';
    default:
      throw `invalid market id ${marketID}`;
  }
};

const loadBinanceQuery = (marketID) => {
  switch (marketID) {
    case 'bnb:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'BNBUSDT');
    case 'bnb:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'BNBUSDT');
    case 'xrp:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'XRPUSDT');
    case 'xrp:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'XRPUSDT');
    case 'btc:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'BTCUSDT');
    case 'btc:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'BTCUSDT');
    case 'kava:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'KAVAUSDT');
    case 'kava:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'KAVAUSDT');
    case 'hard:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'HARDUSDT');
    case 'hard:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'HARDUSDT');
    case 'atom:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'ATOMUSDT');
    case 'busd:usd':
      return ""
    case 'busd:usd:30':
      return ""
    default:
      throw `invalid market id ${marketID}`;
  }
};

const postProcessBinancePrice = (marketID, data) => {
  switch (marketID) {
    case 'bnb:usd:30':
      return calculateAveragePriceBinance(data);
    case 'xrp:usd:30':
      return calculateAveragePriceBinance(data);
    case 'btc:usd:30':
      return calculateAveragePriceBinance(data);
    case 'kava:usd:30':
        return calculateAveragePriceBinance(data);
    case 'hard:usd:30':
        return calculateAveragePriceBinance(data);
    default:
      return data.lastPrice;
  }
};

const calculateAveragePriceBinance = (data) => {
  if (!data[0].length) {
    return 0;
  }
  const prices = data.map((p) => Number(p[4]));
  return prices.reduce((a, b) => a + b, 0) / data.length;
};

const getPercentChange = (p1, p2) => {
  return Math.abs(p1 - p2) / p1;
};

const getPreviousPrice = (prices, marketID, address) => {
  var found = false;
  var index = 0;
  for (var i = 0; i < prices.length; i++) {
    if (prices[i].market_id == marketID) {
      if (prices[i].oracle_address == address) {
        found = true;
        index = i;
        break;
      }
    }
  }
  if (found) {
    return prices[index];
  }
};

module.exports.utils = {
  loadCoinGeckoMarket,
  loadCoinGeckoQuery,
  postProcessCoinGeckoPrice,
  loadBinanceMarket,
  loadBinanceQuery,
  postProcessBinancePrice,
  getPreviousPrice,
  getPercentChange,
};
