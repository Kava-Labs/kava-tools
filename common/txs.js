const axios = require('axios')

export const postTxKava = (kava, chainID, address, ecpairPriv, msg) => {
	// Generate transaction
	kava.getAccounts(address).then(data => {
		let stdSignMsg = kava.newStdMsg({
			msgs: [ msg ],
			chain_id: chainID,
			// TODO: See if we can remove fee
			fee: { amount: [], gas: String(500000) },
			memo: "",
			account_number: String(data.result.value.account_number),
			sequence: String(data.result.value.sequence)
		});
		
		// Sign transaction
		let modeType = "block"
		let signedTx = kava.sign(stdSignMsg, ecpairPriv, modeType);

		// Broadcast transaction
		kava.broadcast(signedTx).then(response => {
			console.log("\tTx hash:", response.txhash)
			console.log("\tLogs:", response.raw_log)
			console.log()
		});
	})
}

export const getTxKava = (url, path, params) => {
	// TODO: Confirm that the request isn't being cached
	const options = {
		headers: {'pragma': 'no-cache'}
	};

	let requestUrl = url.concat(path)

	// Write params to end of path 
	let paramKeys = Object.keys(params)
	if(paramKeys.length > 0) {
		requestUrl = requestUrl.concat("?")
		for(let i = 0; i < paramKeys.length; i++) {
			let key = paramKeys[i]
			let value = params[paramKeys[i]]
			requestUrl = requestUrl.concat(key+"="+value)
			if(i != paramKeys.length - 1) {
				requestUrl = requestUrl.concat("&")
			}
		}
	}

	return axios.get(requestUrl, options)
	.then(res => {
		return { height: res.data.height, result: res.data.result}
	})
	.catch(err => {
		return err
	})
}
