require('dotenv').config()
const BnbChain = require("@binance-chain/javascript-sdk");
const bnbCrypto = BnbChain.crypto;


class DeputyWatcher {
  constructor(balance_threshold=0.00375, bnbChainDeputy) {
    this.balanceThreshold = balance_threshold;
    this.bnbChainDeputy = bnbChainDeputy;
  }

  /**
   * Initialize the Binance Chain client
   * @param {String} lcdURL api endpoint for Binance Chain's rest-server
   * @param {String} mnemonic Binance Chain address mnemonic
   * @param {String} network "testnet" or "mainnet"
   * @return {Promise}
   */
  async initBnbChainClient(lcdURL, mnemonic, network = 'testnet') {
    if (!lcdURL) {
      throw new Error("Binance Chain's rest-server url is required");
    }
    if (!mnemonic) {
      throw new Error('Binance Chain address mnemonic is required');
    }

    // Start Binance Chain client
    this.bnbClient = await new BnbChain(lcdURL);
    this.bnbClient.chooseNetwork(network);
    const privateKey = bnbCrypto.getPrivateKeyFromMnemonic(mnemonic);
    this.bnbClient.setPrivateKey(privateKey);
    try {
      await this.bnbClient.initChain();
    } catch (e) {
      console.log("Cannot connect to Binance Chain's lcd server:", e);
      return;
    }

    // Load our Binance Chain address (required for refunds)
    const bnbAddrPrefix = network == 'mainnet' ? 'bnb' : 'tbnb';
    this.bnbChainAddress = bnbCrypto.getAddressFromPrivateKey(
      privateKey,
      bnbAddrPrefix
    );

    return this;
  }

  async refillDeputy() {
    await this.refillBnbDeputy();
  }

  async refillBnbDeputy() {
    const deputyBalance = await this.bnbClient.getBalance(this.bnbChainDeputy)
    for (const balance of deputyBalance) {
      if (balance.symbol == 'BNB') {
        if (Number(balance.free) < Number(this.balanceThreshold)) {
          console.log("Attempting to refill deputy")
          await this.sendFundsToDeputy()
        } else {
          console.log("deputy does not need refill")
        }
      }
    }
  }

  async sendFundsToDeputy() {
    try {
      const res = await this.bnbClient.transfer(this.bnbChainAddress, this.bnbChainDeputy, "0.00375", "BNB" )
      console.log(res)
    } catch (e) {
      console.error(e)
    }

  }
}

module.exports.DeputyWatcher = DeputyWatcher;