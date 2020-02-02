export const postTxKava = (kava, chainID, address, ecpairPriv, msg) => {
	// Generate transaction
	kava.getAccounts(address).then(data => {
		let stdSignMsg = kava.newStdMsg({
			msgs: [ msg ],
			chain_id: chainID,
			// TODO: See if we can remove fee
			fee: { amount: [ { amount: String(0), denom: "ukava" } ], gas: String(250000) },
			memo: "",
			account_number: String(data.result.value.account_number),
			sequence: String(data.result.value.sequence)
		});
		
		// Sign transaction
		const signedTx = kava.sign(stdSignMsg, ecpairPriv);

		// Broadcast transaction
		kava.broadcast(signedTx).then(response => {
			console.log("\tTx hash:", response.txhash)
			console.log("\tLogs:", response.raw_log)
		});
	})
}


