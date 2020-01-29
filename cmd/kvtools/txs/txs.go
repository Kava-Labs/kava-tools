package txs

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"

	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/x/auth/client/utils"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	"github.com/kava-labs/kava/x/auction/types"
)

const (
	// KavaBaseURL is the base url for kava's rest-server
	KavaBaseURL = "http://127.0.0.1:1317/"
	// AuctionModuleName is the auction module's name
	AuctionModuleName = "auction"
	// Gas is set to a large amount to ensure successful tx sending
	Gas = 500000
)

// GetCurrentAuctions gets a list of the current auctions
func GetCurrentAuctions() (*types.BaseAuction, error) {
	client := &http.Client{}

	auctionURL := fmt.Sprintf("%s/%s/auctions", KavaBaseURL, AuctionModuleName)
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
	var data *types.BaseAuction
	err = json.Unmarshal(respBody, &data)
	if err != nil {
		fmt.Println(err)
	}

	return data, nil
}

// PrepareBid prepares a bid for a collateral auction
func PrepareBid(
	auction types.CollateralAuction,
	bidder sdk.AccAddress,
) types.MsgPlaceBid {
	// Ask user for bid params (3btc, 20usdx, etc.)
	err := errors.New("invalid")
	var coin sdk.Coin
	for err != nil {
		coin, err = readBidCoin()
		if err != nil {
			fmt.Println("Invalid coin. Try again...")
		}
	}

	// Package as MsgPlaceBid
	bid := types.NewMsgPlaceBid(auction.ID, bidder, coin)

	return bid
}

// SendTxRESTServer sends a tx containing to the kava blockchain via the REST server
func SendTxRESTServer(
	chainID string,
	cdc *codec.Codec,
	accAddress sdk.AccAddress,
	moniker string,
	passphrase string,
	cliCtx context.CLIContext,
	msg []sdk.Msg,
	rpcURL string,
) (sdk.TxResponse, error) {

	if rpcURL != "" {
		cliCtx = cliCtx.WithNodeURI(rpcURL)
	}

	cliCtx.SkipConfirm = true

	txBldr := authtypes.NewTxBuilderFromCLI().
		WithTxEncoder(utils.GetTxEncoder(cdc)).
		WithChainID(chainID).
		WithGas(Gas)

	accountRetriever := authtypes.NewAccountRetriever(cliCtx)

	err := accountRetriever.EnsureExists(accAddress)
	if err != nil {
		return sdk.TxResponse{}, err
	}

	// Prepare tx
	txBldr, err = utils.PrepareTxBuilder(txBldr, cliCtx)
	if err != nil {
		return sdk.TxResponse{}, err
	}

	// Build and sign the transaction
	txBytes, err := txBldr.BuildAndSign(moniker, passphrase, msg)
	if err != nil {
		return sdk.TxResponse{}, err
	}

	// TODO: use utils.MakeReq() to send directly to rest-server

	// Broadcast to a Tendermint node
	res, err := cliCtx.BroadcastTxCommit(txBytes)
	if err != nil {
		return sdk.TxResponse{}, err
	}

	return res, nil
}

// readBidCoin reads the user's bid coin
func readBidCoin() (sdk.Coin, error) {
	var bidCoin sdk.Coin
	fmt.Println("Enter coin denom and amount: (example 'bnb20')")
	_, err := fmt.Scan(&bidCoin)
	if err != nil {
		return sdk.Coin{}, err
	}
	return bidCoin, nil
}
