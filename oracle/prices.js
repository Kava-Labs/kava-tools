require('log-timestamp');
const coinUtils = require('./utils.js').utils;
const axios = require('axios');

const DEFAULT_COINGECKO_MIN_INTERVAL_MS = 31000;
const DEFAULT_COINGECKO_TIMEOUT_MS = 10000;
const DEFAULT_COINGECKO_RESET_BUFFER_MS = 250;

let coinGeckoRequestQueue = Promise.resolve();
let nextCoinGeckoRequestAt = 0;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getNonNegativeInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const reserveCoinGeckoRequestSlot = async () => {
  let releaseSlot;
  const previousRequest = coinGeckoRequestQueue;
  coinGeckoRequestQueue = new Promise((resolve) => {
    releaseSlot = resolve;
  });

  await previousRequest;
  try {
    const waitMilliseconds = Math.max(0, nextCoinGeckoRequestAt - Date.now());
    if (waitMilliseconds > 0) {
      await sleep(waitMilliseconds);
    }
    nextCoinGeckoRequestAt =
      Date.now() +
      getNonNegativeInteger(
        process.env.COINGECKO_MIN_INTERVAL_MS,
        DEFAULT_COINGECKO_MIN_INTERVAL_MS
      );
  } finally {
    releaseSlot();
  }
};

const getRateLimitResetTime = (headers) => {
  const reset = headers && headers['x-ratelimit-reset'];
  if (!reset) {
    return;
  }

  const numericReset = Number(reset);
  if (Number.isFinite(numericReset)) {
    return numericReset > 10 ** 12 ? numericReset : numericReset * 1000;
  }

  const parsedReset = Date.parse(reset);
  return Number.isFinite(parsedReset) ? parsedReset : undefined;
};

const fetchCoinGeckoData = async (marketID) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    await reserveCoinGeckoRequestSlot();
    const url = coinUtils.loadCoinGeckoQuery(marketID);
    try {
      return await axios.get(url, {
        timeout: getNonNegativeInteger(
          process.env.COINGECKO_TIMEOUT_MS,
          DEFAULT_COINGECKO_TIMEOUT_MS
        ),
      });
    } catch (error) {
      const response = error.response;
      if (response && response.status === 429 && attempt === 0) {
        const resetAt =
          getRateLimitResetTime(response.headers) || Date.now() + 60000;
        const resetBuffer = getNonNegativeInteger(
          process.env.COINGECKO_RESET_BUFFER_MS,
          DEFAULT_COINGECKO_RESET_BUFFER_MS
        );
        const waitMilliseconds = Math.max(
          0,
          resetAt - Date.now() + resetBuffer
        );
        console.log(
          `coin-gecko rate limited for ${marketID}; remaining=${
            response.headers['x-ratelimit-remaining'] || 'unknown'
          }, retrying after ${new Date(resetAt).toISOString()}`
        );
        await sleep(waitMilliseconds);
        continue;
      }

      const status = response ? response.status : 'network-error';
      console.log(`coin-gecko request failed for ${marketID}; status=${status}`);
      throw error;
    }
  }
};

const resetCoinGeckoRateLimiter = () => {
  coinGeckoRequestQueue = Promise.resolve();
  nextCoinGeckoRequestAt = 0;
};

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
    var priceFetch = await fetchCoinGeckoData(marketID);
  } catch (e) {
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
    console.log(
      `failure to post-process coin-gecko price request for ${marketID}: ${e.message}`
    );
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

module.exports._testing = {
  resetCoinGeckoRateLimiter,
};
