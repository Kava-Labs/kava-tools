process.env.COINGECKO_MIN_INTERVAL_MS = '0';
process.env.COINGECKO_RESET_BUFFER_MS = '0';

const assert = require('assert');
const axios = require('axios');
const PriceOracle = require('./oracle').PriceOracle;
const priceModule = require('./prices');
const prices = priceModule.prices;
const priceTesting = priceModule._testing;
const utils = require('./utils').utils;

const fee = { amount: [], gas: '150000' };

async function testFixedAndDisabledMarkets() {
  const oracle = new PriceOracle(
    [
      'usdx:usd',
      'usdx:usd:30',
      'usdx:usd:720',
      'hard:usd',
      'hard:usd:30',
      'swp:usd',
      'swp:usd:30',
    ],
    '14400',
    '300',
    '0.005',
    fee
  );

  assert.deepStrictEqual(oracle.marketIDs, [
    'usdx:usd',
    'usdx:usd:30',
    'usdx:usd:720',
    'hard:usd',
    'hard:usd:30',
  ]);

  for (const marketID of ['usdx:usd', 'usdx:usd:30', 'usdx:usd:720']) {
    assert.deepStrictEqual(await oracle.fetchPrice(marketID), {
      price: '0.66',
      success: true,
    });
  }

  for (const marketID of ['hard:usd', 'hard:usd:30']) {
    assert.deepStrictEqual(await oracle.fetchPrice(marketID), {
      price: '0.001',
      success: true,
    });
  }

  for (const marketID of ['swp:usd', 'swp:usd:30']) {
    assert.deepStrictEqual(await oracle.fetchPrice(marketID), {
      price: null,
      success: false,
    });
  }

  let postedPrice;
  oracle.client = {
    postPrice: async (_marketID, price) => {
      postedPrice = price;
      return 'hash';
    },
  };
  await oracle.postNewPrice('0.66', 'usdx:usd', { sequence: '0' }, 0);
  assert.strictEqual(postedPrice, '0.660000000000000000');
}

async function testAkashCoinGeckoSupport() {
  assert.strictEqual(utils.loadCoinGeckoMarket('akt:usd'), 'akash-network');
  assert.ok(
    /simple\/price\/?\?ids=akash-network&vs_currencies=usd/.test(
      utils.loadCoinGeckoQuery('akt:usd')
    )
  );
  assert.ok(
    /coins\/akash-network\/market_chart\/range/.test(
      utils.loadCoinGeckoQuery('akt:usd:30')
    )
  );
  assert.strictEqual(
    utils.postProcessCoinGeckoPrice('akt:usd:30', {
      prices: [
        [1, 0.5],
        [2, 0.7],
      ],
    }),
    0.6
  );

  const originalGet = axios.get;
  try {
    axios.get = async (url) => {
      if (url.includes('/market_chart/range')) {
        return {
          data: {
            prices: [
              [1, 0.5],
              [2, 0.7],
            ],
          },
        };
      }
      return { data: { 'akash-network': { usd: 0.61 } } };
    };

    assert.strictEqual(await prices.getCoinGeckoPrice('akt:usd'), 0.61);
    assert.strictEqual(await prices.getCoinGeckoPrice('akt:usd:30'), 0.6);
  } finally {
    axios.get = originalGet;
  }
}

async function testCoinGeckoFailureIsNotSuccessful() {
  const originalGet = axios.get;
  const oracle = new PriceOracle(['akt:usd'], '14400', '300', '0.005', fee);

  try {
    axios.get = async () => ({ data: {} });
    assert.deepStrictEqual(await oracle.fetchPriceCoinGecko('akt:usd'), {
      price: null,
      success: false,
    });
  } finally {
    axios.get = originalGet;
  }
}

async function testCoinGeckoRequestSpacing() {
  const originalGet = axios.get;
  const requestTimes = [];
  process.env.COINGECKO_MIN_INTERVAL_MS = '20';
  priceTesting.resetCoinGeckoRateLimiter();

  try {
    axios.get = async () => {
      requestTimes.push(Date.now());
      return { data: { 'akash-network': { usd: 0.61 } } };
    };

    await Promise.all([
      prices.getCoinGeckoPrice('akt:usd'),
      prices.getCoinGeckoPrice('akt:usd'),
    ]);

    assert.strictEqual(requestTimes.length, 2);
    assert.ok(requestTimes[1] - requestTimes[0] >= 15);
  } finally {
    axios.get = originalGet;
    process.env.COINGECKO_MIN_INTERVAL_MS = '0';
    priceTesting.resetCoinGeckoRateLimiter();
  }
}

async function testCoinGeckoRateLimitResetRetry() {
  const originalGet = axios.get;
  let requestCount = 0;
  const startedAt = Date.now();
  priceTesting.resetCoinGeckoRateLimiter();

  try {
    axios.get = async () => {
      requestCount++;
      if (requestCount === 1) {
        const error = new Error('rate limited');
        error.response = {
          status: 429,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': new Date(Date.now() + 25).toISOString(),
          },
        };
        throw error;
      }
      return { data: { 'akash-network': { usd: 0.61 } } };
    };

    assert.strictEqual(await prices.getCoinGeckoPrice('akt:usd'), 0.61);
    assert.strictEqual(requestCount, 2);
    assert.ok(Date.now() - startedAt >= 15);
  } finally {
    axios.get = originalGet;
    priceTesting.resetCoinGeckoRateLimiter();
  }
}

async function testCoinGeckoPrimaryDoesNotRetryAsBackup() {
  const oracle = new PriceOracle(['akt:usd'], '14400', '300', '0.005', fee);
  let backupCalls = 0;
  oracle.fetchPrimaryPrice = async () => ({ price: null, success: false });
  oracle.fetchBackupPrice = async () => {
    backupCalls++;
    return { price: 1, success: true };
  };

  assert.deepStrictEqual(await oracle.fetchPrice('akt:usd'), {
    price: null,
    success: false,
  });
  assert.strictEqual(backupCalls, 0);

  assert.deepStrictEqual(await oracle.fetchPrice('bnb:usd'), {
    price: 1,
    success: true,
  });
  assert.strictEqual(backupCalls, 1);
}

async function testOverlappingPriceCyclesAreSkipped() {
  const oracle = new PriceOracle([], '14400', '300', '0.005', fee);
  let releaseCycle;
  let internalCalls = 0;
  const cycleGate = new Promise((resolve) => {
    releaseCycle = resolve;
  });
  oracle.postPricesInternal = async () => {
    internalCalls++;
    await cycleGate;
  };

  const firstCycle = oracle.postPrices();
  await Promise.resolve();
  await oracle.postPrices();
  assert.strictEqual(internalCalls, 1);

  releaseCycle();
  await firstCycle;
  assert.strictEqual(oracle.isPostingPrices, false);
}

async function main() {
  await testFixedAndDisabledMarkets();
  await testAkashCoinGeckoSupport();
  await testCoinGeckoFailureIsNotSuccessful();
  await testCoinGeckoRequestSpacing();
  await testCoinGeckoRateLimitResetRetry();
  await testCoinGeckoPrimaryDoesNotRetryAsBackup();
  await testOverlappingPriceCyclesAreSkipped();
  console.log('oracle tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
