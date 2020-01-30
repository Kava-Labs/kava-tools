package rest

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"

	"github.com/kava-labs/kava-tools/cmd/kvtools/common/types"
	auctypes "github.com/kava-labs/kava/x/auction/types"
)

const (
	// BaseURL is the base url for kava's rest-server
	BaseURL = "http://localhost:1317"
	// AuctionModuleName is the auction module's name
	AuctionModuleName = "auction"
)

// GetCurrentAuctions gets a list of the current auctions
func GetCurrentAuctions() (*auctypes.BaseAuction, error) {
	client := &http.Client{}

	auctionURL := fmt.Sprintf("%s/%s/auctions", BaseURL, AuctionModuleName)
	req, err := http.NewRequest("GET", auctionURL, nil)
	if err != nil {
		log.Print(err)
	}
	q := url.Values{}
	req.Header.Set("Accepts", "application/json")
	req.URL.RawQuery = q.Encode()

	// Make an HTTP request
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request to server")
	}

	// Read the response
	respBody, _ := ioutil.ReadAll(resp.Body)

	fmt.Println(respBody)

	// Unmarshal the response to a usable format
	var data *auctypes.BaseAuction
	err = json.Unmarshal(respBody, &data)
	if err != nil {
		fmt.Println(err)
	}

	return data, nil
}

// GetAssetList gets a list of assets on kava
func GetAssetList() {
	// Format URL and HTTP request
	requestURL := fmt.Sprintf("%s/%s", BaseURL, "pricefeed/assets")
	resp, err := MakeReq(requestURL)
	if err != nil {
		fmt.Println(err)
	}

	// Unmarshal the response to a usable format
	var data *types.MarketsRes
	err = json.Unmarshal(resp, &data)
	if err != nil {
		fmt.Println(err)
	}

	// TODO: Unmarshal to object instead of string
	for _, asset := range data.Result {
		fmt.Println(asset)
	}
}

// GetAssetPrice gets an asset's current price on kava
func GetAssetPrice(symbol string) {
	// Format URL and HTTP request
	requestURL := fmt.Sprintf("%s/%s/%s", BaseURL, "pricefeed/currentprice", symbol)
	resp, err := MakeReq(requestURL)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(resp))
}

// MakeReq HTTP request helper
func MakeReq(url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := doReq(req)
	if err != nil {
		return nil, err
	}

	return resp, err
}

// doReq HTTP client
func doReq(req *http.Request) ([]byte, error) {
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if 200 != resp.StatusCode {
		return nil, fmt.Errorf("%s", body)
	}

	return body, nil
}

// // makeReq HTTP request helper
// func makeReq(reqURL string, convert string) ([]byte, error) {
// 	req, err := http.NewRequest("GET", reqURL, nil)
// 	if err != nil {
// 		return nil, err
// 	}

// 	// TODO: generalize this to accept any JSON param
// 	if convert != "" {
// 		q := url.Values{}
// 		q.Add("convert", convert)
// 		req.Header.Set("Accepts", "application/json")
// 		req.URL.RawQuery = q.Encode()
// 	}

// 	resp, err := doReq(req)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return resp, err
// }
