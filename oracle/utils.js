const util = require('util');

//
// Binance
//
const BINANCE_V3_TICKER_REQUEST = util.format(
  'https://api.binance.com/api/v3/ticker/24hr?symbol=%s'
);
// https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
const BINANCE_V3_KLINES_REQUEST = util.format(
  'https://api.binance.com/api/v3/klines?symbol=%s&interval=1m&limit=30'
);

//
// Coingecko
//
// https://www.coingecko.com/en/api/documentation
const COINGECKO_V3_MARKET_RANGE_REQUEST = util.format(
  'https://api.coingecko.com/api/v3/coins/%s/market_chart/range?vs_currency=%s&from=%s&to=%s'
);
const COINGECKO_V3_SIMPLE_PRICE_REQUEST = util.format(
  'https://api.coingecko.com/api/v3/simple/price/?ids=%s&vs_currencies=%s'
);

//
// Ascendex
//
const ASCENDEX_V1_TICKER_REQUEST = util.format(
  'https://ascendex.com/api/pro/v1/ticker?symbol=%s/%s'
);
// https://ascendex.github.io/ascendex-pro-api/#historical-bar-data
const ASCENDEX_V1_30MIN_BARHIST_REQUEST = util.format(
  'https://ascendex.com/api/pro/v1/barhist?symbol=%s/%s&interval=1&n=30'
);
const ASCENDEX_V1_12HR_BARHIST_REQUEST = util.format(
  'https://ascendex.com/api/pro/v1/barhist?symbol=%s/%s&interval=15&n=48'
);

//
// KuCoin
//
const KUCOIN_V1_TICKER_REQUEST = util.format(
  'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=%s-%s'
);
const KUCOIN_V1_30MIN_BARHIST_REQUEST = util.format(
  'https://api.kucoin.com/api/v1/market/candles?type=1min&symbol=%s-%s&start_at=%s'
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
    case 'ust:usd':
      return 'TerraUSD'
    case 'ust:usd:30':
      return 'TerraUSD'
    case 'atom:usd':
      return 'cosmos';
    case 'atom:usd:30':
      return 'cosmos';
    case 'kava:usd':
      return 'kava';
    case 'kava:usd:30':
      return 'kava';
    case 'luna:usd':
      return 'terra-luna';
    case 'luna:usd:30':
      return 'terra-luna';
    case 'akt:usd':
      return 'akash-network'
    case 'akt:usd:30':
      return 'akash-network'
    case 'hard:usd':
      return 'hard-protocol';
    case 'hard:usd:30':
      return 'hard-protocol';
    case 'osmo:usd':
      return 'osmosis';
    case 'osmo:usd:30':
      return 'osmosis';
    case 'eth:usd':
      return 'ethereum';
    case 'eth:usd:30':
      return 'ethereum'
    default:
      throw `invalid coin gecko market id ${marketID}`;
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
    case 'atom:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'cosmos',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
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
    case 'luna:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'terra-luna', 'usd');
    case 'luna:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'terra-luna',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'osmo:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'osmosis', 'usd');
    case 'osmo:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'osmosis',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'busd:usd':
      return '';
    case 'busd:usd:30':
      return '';
    case 'ust:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'terrausd', 'usd');
    case 'ust:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'terrausd',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    case 'eth:usd':
      return util.format(COINGECKO_V3_SIMPLE_PRICE_REQUEST, 'ethereum', 'usd');
    case 'eth:usd:30':
      return util.format(
        COINGECKO_V3_MARKET_RANGE_REQUEST,
        'ethereum',
        'usd',
        String(past30Minutes),
        String(currentTime)
      );
    default:
      throw `invalid coingecko market id ${marketID}`;
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
    case 'osmo:usd:30':
      return calculateAveragePriceCoinGecko(data);
    case 'eth:usd:30':
      return calculateAveragePriceCoinGecko(data);
    default:
      const market = loadCoinGeckoMarket(marketID);
      return data[market].usd;
  }
};

const calculateAveragePriceCoinGecko = (data) => {
  if (!data.prices.length) {
    throw new Error('no data for average price calculation');
  }
  const prices = data.prices.map((p) => p[1]);
  return prices.reduce((a, b) => a + b, 0) / data.prices.length;
};

const loadPrimaryMarket = (marketID) => {
  switch (marketID) {
    case 'usdx:usd':
      return loadAscendexMarket(marketID);
    case 'usdx:usd:30':
      return loadAscendexMarket(marketID);
    case 'usdx:usd:720':
      return loadAscendexMarket(marketID);
    case 'swp:usd':
      return loadAscendexMarket(marketID);
    case 'swp:usd:30':
      return loadAscendexMarket(marketID);
    case 'akt:usd':
      return loadAscendexMarket(marketID);
    case 'akt:usd:30':
      return loadAscendexMarket(marketID);
    case 'osmo:usd':
      return loadCoinGeckoMarket(marketID);
    case 'osmo:usd:30':
      return loadCoinGeckoMarket(marketID);
    default:
      return loadBinanceMarket(marketID);
  }
};

const loadBackupMarket = (marketID) => {
  switch (marketID) {
    case 'usdx:usd':
      return loadAscendexMarket(marketID);
    case 'usdx:usd:30':
      return loadAscendexMarket(marketID);
    case 'usdx:usd:720':
      return loadAscendexMarket(marketID);
    case 'swp:usd':
      return loadAscendexMarket(marketID);
    case 'swp:usd:30':
      return loadAscendexMarket(marketID);
    case 'akt:usd':
      return loadAscendexMarket(marketID);
    case 'akt:usd:30':
      return loadAscendexMarket(marketID);
    default:
      return loadCoinGeckoMarket(marketID);
  }
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
    case 'ust:usd':
      return 'USTUSDT';
    case 'ust:usd:30':
      return 'USTUSDT';
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
    case 'atom:usd:30':
      return 'ATOMUSDT';
    case 'luna:usd':
      return 'LUNAUSDT';
    case 'luna:usd:30':
      return 'LUNAUSDT';
    case 'eth:usd':
      return 'ETHUSDT'
    case 'eth:usd:30':
      return 'ETHUSDT'
    default:
      throw `invalid binance market id ${marketID}`;
  }
};

const loadAscendexMarket = (marketID) => {
  switch (marketID) {
    case 'usdx:usd':
      return 'USDXUSDT';
    case 'usdx:usd:30':
      return 'USDXUSDT';
    case 'usdx:usd:720':
      return 'USDXUSDT';
    case 'swp:usd':
      return 'SWPUSDT';
    case 'swp:usd:30':
      return 'SWPUSDT';
    case 'akt:usd':
      return 'AKTUSDT';
    case 'akt:usd:30':
      return 'AKTUSDT';
    default:
      throw `invalid ascendex market id ${marketID}`;
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
    case 'atom:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'ATOMUSDT');
    case 'luna:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'LUNAUSDT');
    case 'luna:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'LUNAUSDT');
    case 'busd:usd':
      return '';
    case 'busd:usd:30':
      return '';
    case 'ust:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'USTUSDT');
    case 'ust:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'USTUSDT');
    case 'eth:usd':
      return util.format(BINANCE_V3_TICKER_REQUEST, 'ETHUSDT');
    case 'eth:usd:30':
      return util.format(BINANCE_V3_KLINES_REQUEST, 'ETHUSDT');
    default:
      throw `invalid binance (query) market id ${marketID}`;
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
    case 'atom:usd:30':
      return calculateAveragePriceBinance(data);
    case 'luna:usd:30':
      return calculateAveragePriceBinance(data);
    case 'ust:usd:30':
      return 0.0001
    case 'eth:usd:30':
      return calculateAveragePriceBinance(data);
    default:
      return data.lastPrice;
  }
};

const calculateAveragePriceBinance = (data) => {
  if (!data[0].length) {
    throw new Error('no data for average price calculation');
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
  if (prices === null) {
    return
  }
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

const loadAscendexQuery = (marketID) => {
  switch (marketID) {
    case 'usdx:usd':
      return util.format(ASCENDEX_V1_TICKER_REQUEST, 'USDX', 'USDT');
    case 'swp:usd':
      return util.format(ASCENDEX_V1_TICKER_REQUEST, 'SWP', 'USDT');
    case 'usdx:usd:30':
      return util.format(ASCENDEX_V1_30MIN_BARHIST_REQUEST, 'USDX', 'USDT');
    case 'swp:usd:30':
      return util.format(ASCENDEX_V1_30MIN_BARHIST_REQUEST, 'SWP', 'USDT');
    case 'usdx:usd:720':
      return util.format(ASCENDEX_V1_12HR_BARHIST_REQUEST, 'USDX', 'USDT');
    case 'akt:usd:30':
      return util.format(ASCENDEX_V1_30MIN_BARHIST_REQUEST, 'AKT', 'USDT');
    case 'akt:usd':
      return util.format(ASCENDEX_V1_TICKER_REQUEST, 'AKT', 'USDT');
    default:
      throw `invalid ascendex (query) market id ${marketID}`;
  }
};

const postProcessAscendexPrice = (marketID, data) => {
  switch (marketID) {
    case 'usdx:usd:30':
      return calculateAveragePriceAscendex(data);
    case 'usdx:usd:720':
      return calculateAveragePriceAscendex(data);
    case 'swp:usd:30':
      return calculateAveragePriceAscendex(data);
    case 'akt:usd:30':
      return calculateAveragePriceAscendex(data);
    default:
      return data.close;
  }
};

const calculateAveragePriceAscendex = (data) => {
  if (!data.length) {
    throw new Error('no data for average price calculation');
  }
  const prices = data.map((p) => Number(p.data.c));
  return prices.reduce((a, b) => a + b, 0) / data.length;
};

const loadKuCoinQuery = (marketID) => {
  switch (marketID) {
    case 'swp:usd':
      return util.format(KUCOIN_V1_TICKER_REQUEST, 'SWP', 'USDT');
    case 'swp:usd:30':
      return util.format(KUCOIN_V1_30MIN_BARHIST_REQUEST, 'SWP', 'USDT', Math.round(((new Date()).getTime() - 60000 * 30) / 1000));
    default:
      throw `invalid ascendex (query) market id ${marketID}`;
  }
};

const postProcessKuCoinPrice = (marketID, data) => {
  switch (marketID) {
    case 'swp:usd:30':
      return calculateAveragePriceKuCoin(data);
    default:
      return data.price; // close price
  }
};

const calculateAveragePriceKuCoin = (data) => {
  if (!data.length) {
    throw new Error('no data for average price calculation');
  }
  const prices = data.map((p) => Number(p[2])); // close price
  return prices.reduce((a, b) => a + b, 0) / data.length;
};

module.exports.utils = {
  loadCoinGeckoMarket,
  loadCoinGeckoQuery,
  postProcessCoinGeckoPrice,
  loadPrimaryMarket,
  loadBackupMarket,
  loadBinanceMarket,
  loadBinanceQuery,
  loadAscendexMarket,
  loadAscendexQuery,
  loadKuCoinQuery,
  postProcessBinancePrice,
  getPreviousPrice,
  getPercentChange,
  postProcessAscendexPrice,
  postProcessKuCoinPrice,
};
