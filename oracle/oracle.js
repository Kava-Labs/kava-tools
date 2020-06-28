require('dotenv').config();
require('log-timestamp');
const kava = require('@kava-labs/javascript-sdk');
const prices = require(`./prices`).prices;
const utils = require('./utils').utils;

/**
 * Price oracle class for posting prices to Kava.
 */
class PriceOracle {
  constructor(marketIDs, expiry, expiryThreshold, deviation) {
    if (!marketIDs) {
      throw new Error('must specify at least one market ID');
    }
    if (!expiry) {
      throw new Error('must specify an expiration time');
    }
    if (!expiryThreshold) {
      throw new Error('must specify an expiration time threshold');
    }
    if (!deviation) {
      throw new Error('must specify percentage deviation');
    }

    // Validate each market ID on Binance and CoinGecko
    for (let i = 0; i < marketIDs.length; i++) {
      try {
        utils.loadBinanceMarket(marketIDs[i]);
        utils.loadCoinGeckoMarket(marketIDs[i]);
      } catch (e) {
        console.log("couldn't load remote market from market ID, error:", e);
        return;
      }
    }
    this.marketIDs = marketIDs;

    // Set expiration time, expiration threshold, and deviation
    this.expiry = expiry;
    this.expiryThreshold = expiryThreshold;
    this.deviation = deviation;
  }

  /**
   * Initialize the Kava client
   * @param {String} lcdURL api endpoint for Kava's rest-server
   * @param {String} mnemonic Kava address mnemonic
   * @param {Boolean} legacyHDPath
   * @return {Promise}
   */
  async initClient(lcdURL, mnemonic, legacyHDPath=false) {
    if (!lcdURL) {
      throw new Error("chain's rest-server url is required");
    }
    if (!mnemonic) {
      throw new Error("oracle's mnemonic is required");
    }

    // Initiate and set Kava client
    this.client = new kava.KavaClient(lcdURL);
    this.client.setWallet(mnemonic, '', legacyHDPath);
    this.client.setBroadcastMode('sync');
    try {
      await this.client.initChain();
    } catch (e) {
      console.log('Error: cannot connect to lcd server');
      return;
    }
    return this;
  }

  /**
   * Post prices for each market
   */
  async postPrices() {
    var i = 0;
    // fetch account data so we can manually manage sequence when posting
    let accountData
    try {
      var accountData = await kava.tx.loadMetaData(
        this.client.wallet.address,
        this.client.baseURI
      );
    } catch {
      // if the account is new, use the default values, these will be updated
      // after the first tx is created with this account
      accountData = {
        account_number: '0',
        sequence: '0',
      }
    }

    // Attempt to fetch and post prices for each market for valid new prices
    await asyncForEach(this.marketIDs, async (market) => {
      const fetchedPrice = await this.fetchPrice(market);
      if (!fetchedPrice.success) {
        return;
      }

      const shouldPost = await this.validatePricePosting(
        market,
        fetchedPrice.price
      );
      if (!shouldPost) {
        return;
      }
      let txHash;
      try {
        txHash = await this.postNewPrice(
          fetchedPrice.price,
          market,
          accountData,
          i
        );
        console.log('Tx hash:', txHash);
      } catch (e) {
        console.log(`could not post ${market} price`);
        console.log(e);
        return;
      }
      try {
        await this.client.checkTxHash(txHash, 25000);
      } catch (e) {
        console.log(`Tx not accepted by chain: ${e}`);
      }
      i++;
    });
  }

  /**
   * Fetches price for a market ID
   * @param {String} marketID the market's ID
   */
  async fetchPrice(marketID) {
    let res = await this.fetchPriceBinance(marketID);
    if (!res.success) {
      res = await this.fetchPriceBinance(marketID);
    }
    return res;
  }

  /**
   * Fetches price from Binance
   * @param {String} marketID the market's ID
   */
  async fetchPriceBinance(marketID) {
    let retreivedPrice;
    try {
      retreivedPrice = await prices.getBinancePrice(marketID);
    } catch (e) {
      console.log(`could not get ${marketID} price from Binance`);
      return { price: null, success: false };
    }
    return { price: retreivedPrice, success: true };
  }

  /**
   * Fetches price from Coin Gecko
   * @param {String} marketID the market's ID
   */
  async fetchPriceCoinGecko(marketID) {
    let retreivedPrice;
    try {
      retreivedPrice = await prices.getCoinGeckoPrice(marketID);
    } catch (e) {
      console.log(`could not get ${marketID} price from Coin Gecko`);
      return { price: null, success: false };
    }
    return { price: retreivedPrice, success: true };
  }

  /**
   * Validates price post against expiration time and derivation threshold
   * @param {String} marketID the market's ID
   * @param {String} fetchedPrice the fetched price
   */
  async validatePricePosting(marketID, fetchedPrice) {
    // Fetch the previous prices of all markets
    let previousPrices;
    try {
      previousPrices = await this.client.getRawPrices(marketID);
    } catch (e) {
      console.log(`couldn't get previous prices for ${marketID}, skipping...`);
      return true;
    }

    // Get this oracle's previously posted price for this market
    const previousPrice = utils.getPreviousPrice(
      previousPrices,
      marketID,
      this.client.wallet.address
    );

    // Determine if we should post the price according to expiration time and deviation threshold
    if (typeof previousPrice !== 'undefined') {
      if (!this.checkPriceExpiring(previousPrice)) {
        let percentChange = utils.getPercentChange(
          Number.parseFloat(previousPrice.price),
          Number.parseFloat(fetchedPrice)
        );
        if (percentChange < Number.parseFloat(this.deviation)) {
          console.log(
            `previous price of ${previousPrice.price} and current price of ${fetchedPrice} for ${marketID} below threshold for posting`
          );
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Posts a new price for a market ID
   * @param {String} fetchedPrice the fetched price
   * @param {String} marketID the market's ID
   * @param {String} accountData the oracle's account information
   * @param {Number} index the iteration count of the market IDs
   */
  async postNewPrice(fetchedPrice, marketID, accountData, index) {
    if (!fetchedPrice) {
      throw new Error(
        'a retreived price is required in order to post a new price'
      );
    }

    // Set up post price transaction parameters
    let newPrice = Number.parseFloat(fetchedPrice).toFixed(18).toString();
    let expiryDate = new Date();
    expiryDate = new Date(
      expiryDate.getTime() + Number.parseInt(this.expiry) * 1000
    );
    let newExpiry = expiryDate.toISOString().split('.')[0] + 'Z'; // Remove ms from ISO format
    let sequence = String(Number(accountData.sequence) + index);

    console.log(
      `posting price ${newPrice} for ${marketID} with sequence ${sequence}`
    );
    return await this.client.postPrice(marketID, newPrice, newExpiry, sequence);
  }

  /**
   * Checks if the current oracle price is expiring before the threshold
   * @param {String} price the price to validate
   */
  checkPriceExpiring(price) {
    let d1 = Math.floor(new Date(price.expiry).getTime() / 1000);
    let d2 = Math.floor(new Date().getTime() / 1000);
    return d1 - d2 < Number.parseInt(this.expiryThreshold);
  }
}

var asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

module.exports.PriceOracle = PriceOracle;
