export const loadCoinNames = (marketIDs) => {
    let coinNames = []
    for(var i = 0; i < marketIDs.length; i++) {
        switch(marketIDs[i].split(":")[0]) {
            case "xrp":
                coinNames.push("ripple")
                break
            case "bnb":
                coinNames.push("binancecoin")
                break
            case "btc":
                coinNames.push("bitcoin")
                break
            case "atom":
                coinNames.push("cosmos")
                break
            case "kava":
                coinNames.push("kava")
                break
        }
    }
    return coinNames
}