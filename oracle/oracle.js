require('log-timestamp');
const kava = require('@kava-labs/javascript-sdk');
const prices = require(`./prices`).prices;
const utils = require('./utils').utils;

/**
 * Price oracle class for posting prices to Kava.
 */
class PriceOracle {
  constructor(marketIDs, expiry, expiryThreshold, deviation, fee) {
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
    if (!fee) {
      throw new Error('must specify fee')
    }

    // Validate each market ID on Binance and CoinGecko
    for (let i = 0; i < marketIDs.length; i++) {
      try {
        utils.loadPrimaryMarket(marketIDs[i]);
        utils.loadBackupMarket(marketIDs[i]);
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
    this.fee = fee
  }

  /**
   * Initialize the Kava client
   * @param {String} lcdURL api endpoint for Kava's rest-server
   * @param {String} mnemonic Kava address mnemonic
   * @param {Boolean} legacyHDPath
   * @return {Promise}
   */
  async initClient(lcdURL, rpcUrl, mnemonic, legacyHDPath = false) {
    if (!lcdURL) {
      throw new Error("chain's rest-server url is required");
    }
    if (!rpcUrl) {
      throw new Error("chain's rpc url is required for broadcasting txs");
    }
    if (!mnemonic) {
      throw new Error("oracle's mnemonic is required");
    }

    // Initiate and set Kava client
    this.client = new kava.KavaClient(lcdURL, rpcUrl);
    this.client.setWallet(mnemonic, '', legacyHDPath);
    await this.client.setNewWallet(mnemonic, legacyHDPath);
    this.client.setBroadcastMode('sync');
    try {
      await this.client.initChain();
    } catch (e) {
      console.log('Error: cannot connect to lcd server', { e });
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
      accountData = await kava.tx.loadMetaData(
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
      var checkTxError = false
      try {
        await this.client.checkTxHash(txHash, 120000);
      } catch (e) {
        checkTxError = true
      }
      if (checkTxError) {
        try {
          await this.client.checkTxHash(txHash, 120000);
        } catch (error) {
          console.log(`Tx not accepted by chain: ${error}`);
        }
      }
      i++;
    });
  }

  /**
   * Fetches price for a market ID
   * @param {String} marketID the market's ID
   */
  async fetchPrice(marketID) {
    var binanceError = false
    var res
    try {
      res = await this.fetchPrimaryPrice(marketID);
      if (!res.success) {
        binanceError = true
      }
    } catch (error) {
      binanceError = true
    }
    if (binanceError) {
      console.log("trying backup price source after error")
      res = await this.fetchBackupPrice(marketID);
    }
    return res;
  }

  /**
 * Fetches price from the primary source for a market
 * @param {String} marketID the market's ID
 */
  async fetchPrimaryPrice(marketID) {
    let price
    switch (marketID) {
      case 'usdx:usd':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.5, 1.1)
      case 'usdx:usd:30':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.5, 1.1)
      case 'usdx:usd:720':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.5, 1.1)
      case 'swp:usd':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.0, 0.2)
      case 'swp:usd:30':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.0, 0.2)
      case 'akt:usd':
        return this.fetchPriceAscendex(marketID)
      case 'akt:usd:30':
        return this.fetchPriceAscendex(marketID)
      case 'osmo:usd':
        return this.fetchPriceCoinGecko(marketID)
      case 'osmo:usd:30':
        return this.fetchPriceCoinGecko(marketID)
      case 'hard:usd':
        price = await this.fetchPriceBinance(marketID)
        return this.boundPrice(price, 0.0, 0.35)
      case 'hard:usd:30':
        price = await this.fetchPriceBinance(marketID)
        return this.boundPrice(price, 0.0, 0.35)
      case 'kava:usd':
        price = await this.fetchPriceBinance(marketID)
        return this.boundPrice(price, 0.02, 1000000.0)
      case 'kava:usd:30':
        price = await this.fetchPriceBinance(marketID)
        return this.boundPrice(price, 0.02, 1000000.0)
      default:
        return this.fetchPriceBinance(marketID)
    }
  }

  /**
* Fetches price from the backup source for a market
* @param {String} marketID the market's ID
*/
  async fetchBackupPrice(marketID) {
    let price
    switch (marketID) {
      case 'usdx:usd':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.5, 1.1)
      case 'usdx:usd:30':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.5, 1.1)
      case 'usdx:usd:720':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.5, 1.1)
      case 'swp:usd':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.0, 0.2)
      case 'swp:usd:30':
        price = await this.fetchPriceAscendex(marketID)
        return this.boundPrice(price, 0.0, 0.2)
      case 'akt:usd':
        return this.fetchPriceAscendex(marketID)
      case 'akt:usd:30':
        return this.fetchPriceAscendex(marketID)
      case 'hard:usd':
        price = await this.fetchPriceBinance(marketID)
        return this.boundPrice(price, 0.0, 0.35)
      case 'hard:usd:30':
        price = await this.fetchPriceBinance(marketID)
        return this.boundPrice(price, 0.0, 0.35)
      case 'kava:usd':
        price = await this.fetchPriceCoinGecko(marketID)
        return this.boundPrice(price, 0.02, 1000000.0)
      case 'kava:usd:30':
        price = await this.fetchPriceCoinGecko(marketID)
        return this.boundPrice(price, 0.02, 1000000.0)
      default:
        return this.fetchPriceCoinGecko(marketID)
    }
  }

  /**
   * Bounds a price to be within a specified range. 
   * @param {Number} price the price to bound
   * @param {Number} min the lowest possible
   * @param {Number} max the highest possible
   */
  async boundPrice(price, min, max) {
    price.price = Math.min(Math.max(price.price, min), max)
    return price
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
   * Fetches price from Ascendex
   * @param {String} marketID the market's ID
   */
  async fetchPriceAscendex(marketID) {
    let retreivedPrice;
    try {
      retreivedPrice = await prices.getAscendexPrice(marketID);
    } catch (e) {
      console.log(`could not get ${marketID} price from Ascendex`);
      return { price: null, success: false };
    }
    return { price: retreivedPrice, success: true };
  }

  /**
   * Fetches price from KuCoin
   * @param {String} marketID the market's ID
   */
  async fetchPriceKuCoin(marketID) {
    let retreivedPrice;
    try {
      retreivedPrice = await prices.getKuCoinPrice(marketID);
    } catch (e) {
      console.log(`could not get ${marketID} price from KuCoin`);
      return { price: null, success: false };
    }
    return { price: retreivedPrice, success: true };
  }

  /**
   * Fetches price from Ascendex and KuCoin
   * @param {String} marketID the market's ID
   */
  async fetchExchangePrice(marketID) {
    const priceResult1 = await this.fetchPriceAscendex(marketID);
    if (!priceResult1.success) {
      console.log(`could not get ${marketID} ascendex price`)
      return { price: null, success: false }
    }

    const priceResult2 = await this.fetchPriceKuCoin(marketID);
    if (!priceResult2.success) {
      console.log(`could not get ${marketID} kucoin price`)
      return { price: null, success: false }
    }

    const price1 = Number(priceResult1.price);
    const price2 = Number(priceResult2.price);

    const absPriceDiff = Math.abs(price1 - price2);

    if (price1 == 0 || price2 == 0) {
      console.log(`could not get ${marketID} price: exchange price zero`)
      return { price: null, success: false }
    }

    if (absPriceDiff / price1 > 0.7 || absPriceDiff / price2 > 0.7) {
      console.log(`could not get ${marketID} price: price difference too high`);
      return { price: null, success: false }
    }

    return { price: (price1 + price2) / 2, success: true };
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
        if (Number.parseFloat(previousPrice.price) === 0 && Number.parseFloat(fetchedPrice) === 0) {
          console.log(
            `previous price of ${previousPrice.price} and current price of ${fetchedPrice} for ${marketID} are both zero`
          );
          return false
        }

        let percentChange = 0;
        if (Number.parseFloat(previousPrice.price) === 0) {
          percentChange = utils.getPercentChange(
            Number.parseFloat(fetchedPrice), // denominator (non-zero)
            Number.parseFloat(previousPrice.price), // numerator
          );
        } else {
          percentChange = utils.getPercentChange(
            Number.parseFloat(previousPrice.price), // denominator (non-zero)
            Number.parseFloat(fetchedPrice) // numerator
          );
        }

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
    if (!fetchedPrice && (fetchedPrice !== 0 || !prices.isUnlistedMarket(marketID))) {
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
    let sequence = String(Number(accountData.sequence) + index);

    console.log(
      `posting price ${newPrice} for ${marketID} with sequence ${sequence}`
    );
    return await this.client.postPrice(
      marketID,
      newPrice,
      expiryDate,
      this.fee,
      sequence
    );
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
