require('dotenv').config()
const cosmosjs = require("@cosmostation/cosmosjs");
const CoinGecko = require('coingecko-api');
const cron = require('node-cron');

import { postTxKava, getTxKava } from '../common/txs.js';
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
    let account = await kava.getAccounts(address)
    let account_number = account.result.value.account_number
    let sequence = account.result.value.sequence
    for(var i = 0; i < coinNames.length; i++) {
        let priceRaw = priceData.data[coinNames[i]].usd
        let price = Number.parseFloat(priceRaw).toFixed(18).toString()
        let msgPostPrice = newMsgPostPrice(address, marketIDs[i], price)
        postTxKava(kava, chainID, account_number, String(Number(sequence) + i),  ecpairPriv, msgPostPrice).then(
          async(tx_hash) =>  {
            await new Promise(resolve => setTimeout(resolve, 10000))
            getTxKava(lcdURL, "/txs/".concat(tx_hash), {}).then(data => {
              console.log(`Tx Result for ${tx_hash}: ${data.raw_log}\n`)
              })
          }
        )
        await new Promise(resolve => setTimeout(resolve, 10000))
    }
};

// Start cron job
cron.schedule(process.env.CRONTAB, () => {
    routine()
});
