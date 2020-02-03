require('dotenv').config();
const cosmosjs = require("@cosmostation/cosmosjs");
const cron = require('node-cron');
import { postTxKava, getTxKava } from './txs.js';
import { newMsgCreateCDP, newMsgDeposit, newMsgWithdraw, newMsgDrawDebt, newMsgRepayDebt } from './msg.js';

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
		if (resCDP == undefined) {
			console.log("Error: Kava query response is undefined")
			return
		}
		// Response contains a cdp
		if(resCDP.cdp != undefined) {
			console.log("CDP status:")
			console.log("\tID:", resCDP.cdp.id)
			console.log("\tCollateral Value:", resCDP.collateral_value)
			console.log("\tCollateralization:", resCDP.collateralization_ratio)
			console.log()

			cdpAction(resCDP);
			return
		}
		// Generic response - something went wrong
		if(resCDP.response != undefined) {
			// Check for 404
			if(resCDP.response.statusCode != undefined) {
				if(resCDP.response.statusCode = 404) {
					console.log("Status code:", resCDP.response.statusCode)
					console.log("Request URL:", resCDP.response.responseUrl)
				} else {
					console.log("Unknown response status code")
				}
			} else {
				// Status code is undefined on Tendermint errors
				let data = resCDP.response.data
				if(data != undefined) {
					let error = data.error
					let errorObj = JSON.parse(error);
					let code = errorObj.code
					switch(code) {
						// Code 7 is CDP module's ErrCDPNotFound
						case 7:
							console.log("Tendermint error:", errorObj.message)
							cdpCreate();
							break;
						case 1:
							console.log("Tendermint error:", errorObj.message)
							break;
						default:
							console.log("Unkown Tendermint err. Code:", code)
							break;
					}
				}				
			}
		}
	})
	.catch((err) => { 
		console.log(err);
	})

};

var cdpCreate = async() => {
	await getTxKava(BaseUrl.concat("cdp/params"), null)
	.then(resParams => {
		let cAmount, pDenom, pAmount, liquidationRatio, marketID, price
		let collaterals = resParams && resParams.collateral_params && resParams.collateral_params
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
		console.log("Creating CDP. Collateral: ".concat(Math.trunc(cAmount) + cDenom).concat(" Principal: "+(Math.trunc(pAmount) + pDenom)+"."))
		let msgCreateCDP = newMsgCreateCDP(address, cDenom, Math.trunc(cAmount), pDenom, Math.trunc(pAmount))
		postTxKava(kava, chainID, address, ecpairPriv, msgCreateCDP)  
	})
}

var cdpAction = async(resCDP) => {
	// Sanity check
	if(resCDP.cdp == null) {
		return
	}

	// Parse current CDP collateral, principal values
	let cDenom = resCDP.cdp.collateral[0].denom
	let currCAmount = Number(resCDP.cdp.collateral[0].amount)
	let pDenom = resCDP.cdp.principal[0].denom
	let currPAmount = Number(resCDP.cdp.principal[0].amount)

	// TODO: Incorporate real price once pricefeed changes are merged
	let price = Number(0.24)
	let cRatio = (currCAmount * price) / currPAmount

	// Get random amount between 0-9% of current collateral, principal
	let cAmount = Math.floor(Math.random() * (currCAmount / 10));
	let pAmount = Math.floor(Math.random() * (currPAmount / 10));

	let evenOrOdd = Math.floor(Math.random() * 2) + 1;

	if(Number(cRatio) > Number(2.2)) {
	// If collateralization ratio above limit, withdraw colllateral or draw principal
		if(evenOrOdd % 2 == 0) {
			// Withdraw collateral
			// TODO: limit withdraw to above amount that puts the CDP below liquidation ratio
			console.log("Attempting to withdraw ".concat(cAmount + cDenom.concat("...")))
			let msgWithdraw = newMsgWithdraw(address, address, cDenom, cAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgWithdraw)  
		} else {
			// Draw principal
			// NOTE: Cannot draw principal beyond liquidation ratio 
			console.log("Attempting to draw ".concat(pAmount + pDenom.concat("...")))
			let msgDraw = newMsgDrawDebt(address, cDenom, pDenom, pAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgDraw) 
		}
	} else {
	// If collateralization ratio is below limit, deposit collateral or repay principal
		if(evenOrOdd % 2 == 0) {
			// Deposit collateral
			// TODO: Limit deposit amount by account balances
			console.log("Attempting to deposit ".concat(cAmount + cDenom.concat("...")))
			let msgDeposit = newMsgDeposit(address, address, cDenom, cAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgDeposit)  
		} else {
			// Repay principal
			// TODO: Limit repay amount by debt minimum
			// NOTE: Cannot repay more principal than has been drawn
			console.log("Attempting to repay ".concat(pAmount + pDenom.concat("...")))
			let msgRepay = newMsgRepayDebt(address, cDenom, pDenom, pAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgRepay) 
		}
	}
}

// Start cron job
var task = cron.schedule('* * * * *', () => {
    routine()
});

task.start();

// routine()

