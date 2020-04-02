require('dotenv').config()
const kava = require('@kava-labs/javascript-sdk');
const CoinGecko = require('coingecko-api');
const cron = require('node-cron');

const coinUtils = require('./utils.js');


var main = async () => {
    // Load chain details, credentials
    const mnemonic = process.env.MNEMONIC
    const lcdURL = process.env.LCD_URL
    const chainID = process.env.CHAIN_ID;

    // Load params
    const marketIDs = process.env.MARKET_IDS.split(",");
    const coinNames = coinUtils.loadCoinNames(marketIDs)

    // Initiate Kava blockchain
    client = new kava.KavaClient.KavaClient(lcdURL);
    client.setWallet(mnemonic);
    try {
        await client.initChain();
    } catch (e) {
        console.log("cannot connect to lcd server")
        return
    }

    // Initiate the CoinGecko API Client
    const CoinGeckoClient = new CoinGecko();
    let priceData = {}
    try {
        priceFetch = await CoinGeckoClient.simple.price({
            ids: coinNames,
            vs_currencies: ['usd'],
        });
        priceData = priceFetch
    } catch (e) {
        console.log("cannot fetch price from coin-gecko")
        return
    }
    var accountData = await kava.tx.tx.loadMetaData(client.wallet.address, client.baseURI)
    for(var i = 0; i < coinNames.length; i++) {
        let priceRaw = priceData.data[coinNames[i]].usd
        let price = Number.parseFloat(priceRaw).toFixed(18).toString()
        let expiryDate = new Date();
        expiryDate = new Date(expiryDate.getTime() + 6000 * 1000);
        // Remove ms from ISO format
        let expiry = expiryDate.toISOString().split('.')[0]+"Z";
        let sequence = String(Number(accountData.sequence) + i)
        txHash = await client.postPrice(marketIDs[i], price, expiry, sequence)
        console.log(txHash)
    }
};

// Start cron job
cron.schedule(process.env.CRONTAB, () => {
    main()
});
