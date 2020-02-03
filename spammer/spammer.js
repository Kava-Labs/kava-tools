require('dotenv').config();
const cosmosjs = require("@cosmostation/cosmosjs");
const cron = require('node-cron');
import { postTxKava, getTxKava } from '../common/txs.js';
import { newMsgCreateCDP, newMsgDeposit, newMsgWithdraw, newMsgDrawDebt, newMsgRepayDebt } from '../common/msg.js';
import { parseCurrCDP, parseCollateralParams, parseResError } from './utils.js';


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
	return await getTxKava(BaseUrl.concat("cdp/parameters"), null)
	.then(resParams => {
		if(resParams.collateral_params == null) {
			console.log("Bad response on CDP module params query:")
			console.log(resParams)
			return
		}
		return parseCollateralParams(resParams, cDenom)
	})
}

// Loads assets current price
var loadAssetPrice = async(marketID) => {
	return await getTxKava(BaseUrl.concat("pricefeed/price/").concat(marketID), null)
	.then(resPrice => {
		return resPrice
	})
}

// Load existing CDP
var loadExistingCDP = async(address, cDenom) => {
	return await getTxKava(BaseUrl.concat("cdp/cdps/cdp/").concat(address+"/"+cDenom), null)
	.then(resCDP => {
		return resCDP
	})
}

// Create a new CDP with the minimum debt limit
var cdpCreate = async(cDenom, params, price) => {
	let truncCAmount = Math.trunc((params.pDebtLimit / price) * (params.liquidationRatio * 1.01))
	let truncPAmount =  Math.trunc(params.pDebtLimit)
	console.log("Creating CDP. Collateral: ".concat(truncCAmount + cDenom).concat(" Principal: "+(truncPAmount + params.pDenom)+"."))
	let msgCreateCDP = newMsgCreateCDP(address, cDenom, truncCAmount, params.pDenom, truncPAmount)
	postTxKava(kava, chainID, address, ecpairPriv, msgCreateCDP)
}

// Perform deposit, withdraw, draw, or repay action on existing CDP
var cdpAction = async(cdp, debtLimit) => {
	let cDenom = cdp.cDenom
	let pDenom = cdp.pDenom

	// Get random amount between 0-9% of current collateral
	let cAmount = Math.floor(Math.random() * ( cdp.currCAmount / 10));

	// Set principal amount to debt limit
	let pAmount = debtLimit // TODO: revisit this

	let evenOrOdd = Math.floor(Math.random() * 2) + 1;
	if(Number(cdp.cRatio) > Number(2.2)) {
	// If collateralization ratio is above 220%
		if(evenOrOdd % 2 == 0) {
			// Withdraw collateral
			console.log("\tAttempting to withdraw ".concat(cAmount + cDenom.concat("...")))
			let msgWithdraw = newMsgWithdraw(address, address, cDenom, cAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgWithdraw)  
		} else {
			// Draw principal
			console.log("\tAttempting to draw ".concat(pAmount + pDenom.concat("...")))
			let msgDraw = newMsgDrawDebt(address, cDenom, pDenom, pAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgDraw) 
		}
	} else {
	// If collateralization ratio is below 220%
		if(evenOrOdd % 2 == 0) {
			// Deposit collateral
			console.log("\tAttempting to deposit ".concat(cAmount + cDenom.concat("...")))
			let msgDeposit = newMsgDeposit(address, address, cDenom, cAmount)
			postTxKava(kava, chainID, address, ecpairPriv, msgDeposit)  
		} else {
			// Repay principal
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
		if (params == null) {
			return console.log("Exiting")
		}
		loadAssetPrice(params.marketID)
		.then(resPrice => {
			let price = Number(resPrice.price)
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
					try {
						parseResError(res)
						.then(create => {
							if(create == true) {
								cdpCreate(cDenom, params, price);
							}
						})
					} catch (err) {
						console.log("Full error:", err)
						console.log("\nTry restarting the rest-server.")
					}
				}
			})
		})
	})
}

// Start cron job
var task = cron.schedule('* * * * *', () => {
    routine()
});

task.start();

