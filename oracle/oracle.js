require('dotenv').config()
const cosmosjs = require("@cosmostation/cosmosjs");
const CoinGecko = require('coingecko-api');
const cron = require('node-cron');

import { postTxKava } from '../common/txs.js';
import { newMsgPostPrice } from '../common/msg.js';
import { loadCoinNames } from './utils.js';

// Load chain details, credentials
const mnemonic = process.env.MNEMONIC
const lcdURL = process.env.LCD_URL
const chainID = process.env.CHAIN_ID;

// Load params
const marketIDs = process.env.MARKET_IDS.split(",");
const coinNames = loadCoinNames(marketIDs)

// Initiate Kava blockchain
const kava = cosmosjs.network(lcdURL, chainID);
kava.setBech32MainPrefix("kava");
kava.setPath("m/44'/118'/0'/0/0");

// Load account credentials
const address = kava.getAddress(mnemonic);
const ecpairPriv = kava.getECPairPriv(mnemonic);

// Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

var routine = async() => {
    const priceData = await CoinGeckoClient.simple.price({
        ids: coinNames,
        vs_currencies: ['usd'],
    });

    for(var i = 0; i < coinNames.length; i++) {
        let priceRaw = priceData.data[coinNames[i]].usd
        let price = Number.parseFloat(priceRaw).toPrecision(18).toString();
        // Format msg as JSON
        let msgPostPrice = newMsgPostPrice(address, marketIDs[i], price)
        // Send to Kava blockchain
        console.log(coinNames[i], ": posting price", priceRaw)
        postTxKava(kava, chainID, address, ecpairPriv, msgPostPrice)
    }
};

// Start cron job
cron.schedule('* * * * *', () => {
    routine()
});
