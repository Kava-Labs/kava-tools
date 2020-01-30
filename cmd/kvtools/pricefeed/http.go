package pricefeed

import (
	"encoding/json"
	"fmt"

	"github.com/kava-labs/kava-tools/cmd/kvtools/common/rest"
)

// BaseURL is the base url for kava's rest-server
const BaseURL = "http://localhost:1317"

// GetAssetPrice gets an asset's current price on kava
func GetAssetPrice(symbol string) {
	// Format URL and HTTP request
	requestURL := fmt.Sprintf("%s/%s/%s", BaseURL, "pricefeed/currentprice", symbol)
	resp, err := rest.MakeReq(requestURL)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(resp))
}

// GetAssetList gets a list of assets on kava
func GetAssetList() {
	// Format URL and HTTP request
	requestURL := fmt.Sprintf("%s/%s", BaseURL, "pricefeed/assets")
	resp, err := rest.MakeReq(requestURL)
	if err != nil {
		fmt.Println(err)
	}

	// Unmarshal the response to a usable format
	var data *MarketsRes
	err = json.Unmarshal(resp, &data)
	if err != nil {
		fmt.Println(err)
	}

	// TODO: Unmarshal to object instead of string
	for _, asset := range data.Result {
		fmt.Println(asset)
	}
}
