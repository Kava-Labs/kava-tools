// Parse current CDP
export const parseCurrCDP = (res) => {
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

// Parse collateral params
export const parseCollateralParams = (res, cDenom) => {
    if(res.collateral_params == undefined) {
        return null
    }
    let collaterals = res.collateral_params
    for(var i = 0; i < collaterals.length; i++) {
        if(collaterals[i].denom == cDenom) {
            let pDenom = collaterals[i].debt_limit[0].denom
            let pDebtLimit = Number(collaterals[i].debt_limit[0].amount)
            let liquidationRatio = Number(collaterals[i].liquidation_ratio)
            let marketID = collaterals[i].market_id
            return {"pDenom": pDenom, "pDebtLimit": pDebtLimit, "liquidationRatio": liquidationRatio, "marketID": marketID}
        }
    }
    return null
}

// Parse CDP query response error and return bool controlling CDP creation.
// If error = 'CDPNotFoundErr', then returns true. Otherwise returns false.
export const parseResError = (res) => {
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