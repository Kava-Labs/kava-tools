const assert = require('assert');
const axios = require('axios');
const PriceOracle = require('./oracle').PriceOracle;
const prices = require('./prices').prices;
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

async function main() {
  await testFixedAndDisabledMarkets();
  await testAkashCoinGeckoSupport();
  await testCoinGeckoFailureIsNotSuccessful();
  console.log('oracle tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
