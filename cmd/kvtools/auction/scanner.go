package auction

import (
	"errors"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ScanBidDecision reads the users bid decision input
func ScanBidDecision() (bool, error) {
	var placeBidDecision bool
	fmt.Println("Do you want to place a bid (y/n):")
	_, err := fmt.Scanln(&placeBidDecision)
	if err != nil {
		return false, err
	}
	return placeBidDecision, nil
}

// ScanBidCoin takes user input for their sdk.Coin bid
func ScanBidCoin() (sdk.Coin, error) {
	var coin sdk.Coin
	err := errors.New("non-nil error")
	for err != nil {
		fmt.Println("Enter coin denom and amount: (example 'bnb20')")
		// Scan user input
		_, err = fmt.Scan(&coin)
		if err != nil {
			fmt.Println("Invalid coin. Try again...")
			// TODO: allow user to cancel coin input
		}
	}
	return coin, nil
}
