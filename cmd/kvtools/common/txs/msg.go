package txs

import (
	"errors"
	"fmt"
	"time"

	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/kava-labs/kava-tools/cmd/kvtools/common/types"
	auctypes "github.com/kava-labs/kava/x/auction/types"
	pftypes "github.com/kava-labs/kava/x/pricefeed/types"
)

// BuildPostPriceAndSend builds a MsgPostPrice and sends it to the kava blockchain
// TODO: just build..
func BuildPostPriceAndSend(
	asset types.Asset,
	accAddress sdk.AccAddress,
	chainID string,
	cdc *codec.Codec,
	oracleName string,
	passphrase string,
	cliCtx context.CLIContext,
	rpcURL string,
) (sdk.TxResponse, error) {
	// Parse the price
	price, err := sdk.NewDecFromStr(fmt.Sprintf("%f", asset.Price))
	if err != nil {
		return sdk.TxResponse{}, err
	}

	// Set expiration time to 1 day in the future
	expiry := time.Now().Add(24 * time.Hour)

	// Initialize and validate the msg
	msg := pftypes.NewMsgPostPrice(accAddress, asset.TargetMarketCode, price, expiry)
	err = msg.ValidateBasic()
	if err != nil {
		return sdk.TxResponse{}, err
	}

	// Send tx containing msg to kava
	txRes, sdkErr := SendTxPostPrice(chainID, cdc, accAddress, oracleName, passphrase, cliCtx, &msg, rpcURL)
	if sdkErr != nil {
		return sdk.TxResponse{}, sdkErr
	}

	return txRes, nil
}

// PrepareBid prepares a bid for a collateral auction
func PrepareBid(
	auction auctypes.CollateralAuction,
	bidder sdk.AccAddress,
) auctypes.MsgPlaceBid {
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
	bid := auctypes.NewMsgPlaceBid(auction.ID, bidder, coin)

	return bid
}

// TODO: remove
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
