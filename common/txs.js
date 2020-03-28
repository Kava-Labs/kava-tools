const axios = require("axios");

export const postTxKava = (
  kava,
  chainID,
  account_number,
  sequence,
  ecpairPriv,
  msg
  // coins // TODO: Update all postTxKava calls with 'coins'
) => {
  return new Promise((resolve, reject) => {
    let stdSignMsg = kava.newStdMsg({
      msgs: [msg],
      chain_id: chainID,
      fee: { amount: [], gas: String(250000) },
      memo: "",
      account_number: account_number,
      sequence: sequence
    });
    // Sign transaction
    let modeType = "sync";
    let signedTx = kava.sign(stdSignMsg, ecpairPriv, modeType);
    // Broadcast transaction
    kava.broadcast(signedTx).then(response => {
      resolve(response.txhash);
    });
  });
};

export const getTxKava = (url, path, params) => {
  const options = {
    headers: { pragma: "no-cache" }
  };

  let requestUrl = url.concat(path);

  // Write params to end of path
  let paramKeys = Object.keys(params);
  if (paramKeys.length > 0) {
    requestUrl = requestUrl.concat("?");
    for (let i = 0; i < paramKeys.length; i++) {
      let key = paramKeys[i];
      let value = params[paramKeys[i]];
      requestUrl = requestUrl.concat(key + "=" + value);
      if (i != paramKeys.length - 1) {
        requestUrl = requestUrl.concat("&");
      }
    }
  }

  return axios
    .get(requestUrl, options)
    .then(res => {
      return res.data;
    })
    .catch(err => {
      return err;
    });
};
