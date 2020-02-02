require('dotenv').config();
const cosmosjs = require("@cosmostation/cosmosjs");
const cron = require('node-cron');
import { postTxKava, getTxKava } from './txs.js';
import { newMsgCreateCDP } from './msg.js';

// Load chain details, credentials
const mnemonic = process.env.MNEMONIC
const lcdURL = process.env.LCD_URL
const chainID = process.env.CHAIN_ID;
const BaseUrl = "http://localhost:1317/"

// Load params
const cDenom = process.env.COLLATERAL_DENOM;

// Initiate Kava blockchain
const kava = cosmosjs.network(lcdURL, chainID);
kava.setBech32MainPrefix("kava");
kava.setPath("m/44'/118'/0'/0/0");

// // Load account credentials
const address = kava.getAddress(mnemonic);
const ecpairPriv = kava.getECPairPriv(mnemonic);

var routine = async() => {
	// Get existing CDP
	await getTxKava(BaseUrl.concat("cdps/cdp/").concat(address+"/"+cDenom), null)
	.then(resCDP => {
		console.log(resCDP)
	})

	// Get CDP module params
	await getTxKava(BaseUrl.concat("cdp/params"), null)
	.then(resParams => {
		let cAmount, pDenom, pAmount, liquidationRatio, marketID, price
		const collaterals = resParams && resParams.collateral_params && resParams.collateral_params
		for(var i = 0; i < collaterals.length; i++) {
			if(collaterals[i].denom == cDenom) {
				pDenom = collaterals[i].debt_limit[0].denom
				pAmount = Number(collaterals[i].debt_limit[0].amount)
				liquidationRatio = Number(collaterals[i].liquidation_ratio)
				marketID = collaterals[i].market_id
			}
		}

		// TODO: Incorporate this request once pricefeed changes are merged
		// getTxKava(BaseUrl.concat("/pricefeed/price/".concat(marketID)), null)
		// .then(resPrice => {
			// console.log(resPrice)
			price = Number(0.238532999999999995)
			cAmount = (pAmount / price) * (liquidationRatio * 1.01)
		// })
		const cAmountPerc = Number.parseFloat(cAmount).toPrecision(18).toString();
		const pAmountPerc = Number.parseFloat(pAmount).toPrecision(18).toString();
		let msgCreateCDP = newMsgCreateCDP(address, cDenom, Math.trunc(cAmount), pDenom, Math.trunc(pAmount))

		console.log(msgCreateCDP.value.sender)
		console.log(msgCreateCDP.value.collateral[0])
		console.log(msgCreateCDP.value.principal[0])

		postTxKava(kava, chainID, address, ecpairPriv, msgCreateCDP)  

	})

	// Set up new source of randomness
	// Attempt to locate existing CDP for this user/collateral denom
	// If no existing CDP is found, create new CDP
    // If found:
        // 1.  Get price via query
		// 2. Multiply limit by 2
		// 3. Divide limit by price = collateral amount
        // Create collateral and principal coin
        // Format msg as JSON
    // Else:
        // Load current CDP values for coin amount generation
	    // Get random amount of collateral between 1-25% current collateral
		// If collateralization ratio above limit, withdraw colllateral or draw principal
		// If collateralization ratio is below limit, deposit collateral or repay principal


	// Send tx containing the msg
    // postTxKava(kava, chainID, address, ecpairPriv, msgCreateCDP)  
};

routine()

// // Start cron job
// cron.schedule('* * * * *', () => {
//     routine()
// });