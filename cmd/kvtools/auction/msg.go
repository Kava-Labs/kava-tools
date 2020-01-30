package auction

import (
	"errors"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
	auctypes "github.com/kava-labs/kava/x/auction/types"
)

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
