package auction

import (
	"fmt"
	"strconv"

	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/kava-labs/kava/x/auction/types"
	tmCommon "github.com/tendermint/tendermint/libs/common"
)

// GetEventAttributes parses details from a new CollateralAuction
func GetEventAttributes(attributes []tmCommon.KVPair) (types.CollateralAuction, error) {
	// TODO: Surplus, Debt auctions
	var auction types.CollateralAuction

	// Iterate over attributes
	for _, attribute := range attributes {
		// Get (key, value) for each attribute
		key := string(attribute.GetKey())
		val := string(attribute.GetValue())

		fmt.Printf("\nkey: %v", key)
		fmt.Printf("\nvalue: %v", val)

		var bidDenom string
		var lotDenom string
		bidAmt := -1
		lotAmt := -1

		// Set variable based on value of attribute
		switch key {
		case types.AttributeKeyAuctionID:
			id, err := strconv.ParseUint(val, 10, 64)
			if err != nil {
				return types.CollateralAuction{}, err
			}
			auction.ID = id
			fmt.Printf("\nAttributeKeyAuctionID: %v", val)
		case types.AttributeKeyAuctionType:
			fmt.Printf("\nAttributeKeyAuctionType: %v", val)
		case types.AttributeKeyBidder:
			auction.Bidder = nil
			fmt.Printf("\nAttributeKeyBidder: %v", val)
		case types.AttributeKeyBidDenom:
			bidDenom = val
			if bidAmt > -1 {
				auction.Bid = sdk.NewCoin(bidDenom, sdk.NewInt(int64(bidAmt)))
			}
			fmt.Printf("\nAttributeKeyBidDenom: %v", val)
		case types.AttributeKeyLotDenom:
			lotDenom = val
			if lotAmt > -1 {
				auction.Lot = sdk.NewCoin(lotDenom, sdk.NewInt(int64(lotAmt)))
			}
			fmt.Printf("\nAttributeKeyLotDenom: %v", val)
		case types.AttributeKeyBidAmount:
			bidAmt, err := strconv.ParseUint(val, 10, 64)
			if err != nil {
				return types.CollateralAuction{}, err
			}
			if len(bidDenom) > 0 {
				auction.Bid = sdk.NewCoin(bidDenom, sdk.NewInt(int64(bidAmt)))
			}
			fmt.Printf("\nAttributeKeyBidAmount: %v", val)
		case types.AttributeKeyLotAmount:
			lotAmt, err := strconv.ParseUint(val, 10, 64)
			if err != nil {
				return types.CollateralAuction{}, err
			}
			if len(lotDenom) > 0 {
				auction.Lot = sdk.NewCoin(lotDenom, sdk.NewInt(int64(lotAmt)))
			}
			fmt.Printf("\nAttributeKeyLotAmount: %v", val)
		case types.AttributeKeyEndTime:
			endtime, err := strconv.ParseUint(val, 10, 64)
			if err != nil {
				return types.CollateralAuction{}, err
			}
			_ = endtime
			// TODO: auction.EndTime = time.Time(endtime)
			fmt.Printf("\nAttributeKeyEndTime: %v", val)
		}
	}

	return auction, nil
}
