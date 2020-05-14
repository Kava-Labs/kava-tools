require('dotenv').config()
const kava = require('@kava-labs/javascript-sdk');
const prices = require(`./prices.js`)
const utils = require('./utils.js')
const cron = require('node-cron');


var main = async () => {
    // Load chain details, credentials
    const mnemonic = process.env.MNEMONIC
    const lcdURL = process.env.LCD_URL
    const marketIDs = process.env.MARKET_IDS.split(",");


    // Initiate Kava blockchain
    client = new kava.KavaClient(lcdURL);
    client.setWallet(mnemonic);
    try {
        await client.initChain();
    } catch (e) {
        console.log("cannot connect to lcd server")
        return
    }
    // fetch accountData so we can manually manage account sequence
    var accountData = await kava.tx.loadMetaData(client.wallet.address, client.baseURI)
    for(var i = 0; i < marketIDs.length; i++) {
        try {
           var retreivedPrice = await prices.getBinancePrice(marketIDs[i])
        } catch (e) {
            console.log(`could not get ${marketIDs[i]} price from binance, attempting coin gecko`)
            try {
                var retreivedPrice = await prices.getCoinGeckoPrice(marketIDs[i])
            } catch (e) {
                console.log(`could not get ${marketIDs[i]} price from coin gecko, exiting`)
                continue
            }
        }
        try {
           var previousPrices = await client.getRawPrices(marketIDs[i])
           var previousPrice = utils.getPreviousPrice(client.wallet.address, previousPrices)
           if (typeof previousPrice !== 'undefined') {
               var percentChange = utils.getPercentChange(Number.parseFloat(previousPrice), Number.parseFloat(retreivedPrice))
               if (percentChange < Number.parseFloat(process.env.DEVIATION)) {
                console.log(`previous price of ${previousPrice} and current price of ${retreivedPrice} for ${marketIDs[i]} below threshold for posting`)
                   continue
               }
           }
           let postPrice = Number.parseFloat(retreivedPrice).toFixed(18).toString()
           let expiryDate = new Date();
           expiryDate = new Date(expiryDate.getTime() + 6000 * 1000);
           // Remove ms from ISO format
           let expiry = expiryDate.toISOString().split('.')[0]+"Z";
           let sequence = String(Number(accountData.sequence) + i)
           txHash = await client.postPrice(marketIDs[i], postPrice, expiry, sequence)
           console.log(txHash)
        } catch (e) {
            console.log(`could not post ${marketIDs[i]} price, exiting`)
            console.log(e)
        }
    }
};


// Start cron job
// cron.schedule(process.env.CRONTAB, () => {
main()
// });
