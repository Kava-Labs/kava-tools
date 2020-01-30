package pricefeed

import (
	"encoding/json"
	"fmt"

	"github.com/kava-labs/kava-tools/cmd/kvtools/common/rest"
)

const (
	coinGeckoBaseURL = "https://api.coingecko.com/api/v3/coins/"
)

// GetCoinGeckoPrices gets prices for an array of coins by their symbols
func GetCoinGeckoPrices(symbols []string, convert string) []Asset {
	var assets []Asset
	marketCodeDict := buildMarketCodeDict()

	for _, symbol := range symbols {
		requestURL := fmt.Sprintf("%s/%s/tickers", coinGeckoBaseURL, symbol)

		// resp, err := MakeReq(requestURL, convert)
		resp, err := rest.MakeReq(requestURL)
		if err != nil {
			fmt.Println(err)
		}

		// Unmarshal the response to a usable format
		var data *CoinGeckoTickers
		err = json.Unmarshal(resp, &data)
		if err != nil {
			fmt.Println(err)
		}

		// Use coin's USDT market from Binance
		if data != nil && data.Tickers != nil {
			for _, ticker := range data.Tickers {
				if ticker.Market.Name == "Binance" && ticker.Target == "USDT" {
					asset := Asset{
						Symbol:           data.Name,
						Price:            ticker.Last,
						TargetMarketCode: marketCodeDict[symbol],
					}
					assets = append(assets, asset)
				}
			}
		}
	}
	return assets
}

// TODO: REMOVE
// TODO: Replace this with dynamically populated asset list
func buildMarketCodeDict() map[string]string {
	var codeDict = make(map[string]string)

	codeDict["bitcoin"] = "btc:usd"
	codeDict["kava"] = "kava:usd"
	codeDict["ripple"] = "xrp:usd"
	codeDict["binancecoin"] = "bnb:usd"
	codeDict["cosmos"] = "atom:usd"

	return codeDict
}
