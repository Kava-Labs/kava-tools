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

// Load CDP module params
var loadModuleParams = async(cDenom) => {
	return await getTxKava(BaseUrl.concat("cdp/params"), null)
	.then(resParams => {
		if(resParams.collateral_params == null) {
			return
		}
		let pDenom, pDebtLimit, liquidationRatio, marketID
		let collaterals = resParams.collateral_params
		for(var i = 0; i < collaterals.length; i++) {
			if(collaterals[i].denom == cDenom) {
				pDenom = collaterals[i].debt_limit[0].denom
				pDebtLimit = Number(collaterals[i].debt_limit[0].amount)
				liquidationRatio = Number(collaterals[i].liquidation_ratio)
				marketID = collaterals[i].market_id
				return {"pDenom": pDenom, "pDebtLimit": pDebtLimit, "liquidationRatio": liquidationRatio, "marketID": marketID}
			}
		}
		return {"pDenom": null, "pDebtLimit": null, "liquidationRatio": null, "marketID": null}
	})
}

// Load existing CDP
var loadExistingCDP = async(address, cDenom) => {
	return await getTxKava(BaseUrl.concat("cdps/cdp/").concat(address+"/"+cDenom), null)
	.then(resCDP => {
		return resCDP
	})
}

// Parse CDP query response error and return bool controlling CDP creation.
// If error = 'CDPNotFoundErr', then returns true. Otherwise returns false.
var parseResError = async(res) => {
	if(res.response != undefined) {
		// Check for 404
		if(res.response.statusCode != undefined) {
			if(res.response.statusCode = 404) {
				console.log("Status code:", res.response.statusCode)
				console.log("Request URL:", res.response.responseUrl)
			} else {
				console.log("Unknown response status code")
			}
		} else {
			// Status code is undefined on Tendermint errors
			let data = res.response.data
			if(data != undefined) {
				let error = data.error
				let errorObj = JSON.parse(error);
				let code = errorObj.code
				switch(code) {
					// Code 7 is CDP module's ErrCDPNotFound
					case 7:
						console.log("Tendermint error:", errorObj.message)
						return true
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
	return false
}

// Create a new CDP with the minimum debt limit
var cdpCreate = async(cDenom, params) => {
	let pDenom = params.pDenom
	let pAmount = params.pAmount
	let liquidationRatio = params.liquidationRatio
	let marketID = params.marketID
	
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
}

// Parse CDP into workable structure
var parseCurrCDP = (res) => {
	return {
		"ID": res.cdp.id,
		"cDenom": res.cdp.collateral[0].denom,
		"currCAmount": Number(res.cdp.collateral[0].amount),
		"pDenom": res.cdp.principal[0].denom,
		"currPAmount": Number(res.cdp.principal[0].amount),
		"cValue": res.collateral_value,
		"cRatio": res.collateralization_ratio
	}
}

// Perform deposit, withdraw, draw, or repay action on existing CDP
var cdpAction = async(cdp, debtLimit) => {
	// Parse current CDP collateral, principal values
	let cDenom = cdp.cDenom
	let currCAmount = cdp.currCAmount
	let pDenom = cdp.pDenom
	let currPAmount = cdp.currPAmount

	// TODO: Incorporate real price once pricefeed changes are merged
	let price = Number(0.24)
	let cRatio = (currCAmount * price) / currPAmount

	// Get random amount between 0-9% of current collateral, principal
	let cAmount = Math.floor(Math.random() * (currCAmount / 10));
	let pAmount = debtLimit
	// let pAmount = Math.floor(Math.random() * (currPAmount / 10));

	let evenOrOdd = Math.floor(Math.random() * 2) + 1;

	if(Number(cRatio) > Number(2.2)) {
	// If collateralization ratio above limit, withdraw colllateral or draw principal
		if(evenOrOdd % 2 == 0) {
			// Withdraw collateral
			// TODO: limit withdraw to above amount that puts the CDP below liquidation ratio
			console.log("\tAttempting to withdraw ".concat(cAmount + cDenom.concat("...")))
			let msgWithdraw = newMsgWithdraw(address, address, cDenom, cAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgWithdraw)  
		} else {
			// Draw principal
			// NOTE: Cannot draw principal beyond liquidation ratio 
			console.log("\tAttempting to draw ".concat(pAmount + pDenom.concat("...")))
			let msgDraw = newMsgDrawDebt(address, cDenom, pDenom, pAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgDraw) 
		}
	} else {
	// If collateralization ratio is below limit, deposit collateral or repay principal
		if(evenOrOdd % 2 == 0) {
			// Deposit collateral
			// TODO: Limit deposit amount by account balances
			console.log("\tAttempting to deposit ".concat(cAmount + cDenom.concat("...")))
			let msgDeposit = newMsgDeposit(address, address, cDenom, cAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgDeposit)  
		} else {
			// Repay principal
			// TODO: Limit repay amount by debt minimum
			// NOTE: Cannot repay more principal than has been drawn
			console.log("\tAttempting to repay ".concat(pAmount + pDenom.concat("...")))
			let msgRepay = newMsgRepayDebt(address, cDenom, pDenom, pAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgRepay) 
		}
	}
}

// Primary cron routine
var routine = async() => {
	loadModuleParams(cDenom)
	.then(params => {
		loadExistingCDP(address, cDenom)
		.then(res => {
			if (res == undefined) {
				console.log("Error: Kava query response is undefined. Cannot proceed.")
				return
			}
			// Response contains a cdp
			if(res.cdp != undefined) {
				let cdp = parseCurrCDP(res)

				console.log("CDP ID:", cdp.ID)
				console.log("\tCollateral Value:", cdp.cValue)
				console.log("\tCollateralization:", cdp.cRatio)
				console.log()

				cdpAction(cdp, params.pDebtLimit);
				return
			}
			// Response doesn't contain a cdp
			if(res.response != undefined) {
				parseResError(res)
				.then(create => {
					if(create == true) {
						cdpCreate(cDenom, params.collateral_params);
					}
				})
			}
		})
	})
}

// Start cron job
var task = cron.schedule('* * * * *', () => {
    routine()
});

task.start();

