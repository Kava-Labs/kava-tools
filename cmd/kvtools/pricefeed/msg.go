package pricefeed

import (
	"fmt"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"

	pftypes "github.com/kava-labs/kava/x/pricefeed/types"
)

// // Send tx containing msg to kava
// txRes, sdkErr := SendTxPostPrice(chainID, cdc, accAddress, oracleName, passphrase, cliCtx, &msg, rpcURL)
// if sdkErr != nil {
// 	return sdk.TxResponse{}, sdkErr
// }

// BuildPostPrice builds a MsgPostPrice
func BuildPostPrice(asset Asset, accAddress sdk.AccAddress) ([]sdk.Msg, error) {
	// Parse the price
	price, err := sdk.NewDecFromStr(fmt.Sprintf("%f", asset.Price))
	if err != nil {
		return []sdk.Msg{}, err
	}

	// Set expiration time to 1 day in the future
	expiry := time.Now().Add(24 * time.Hour)

	// msg = []sdk.Msg{pftypes.NewMsgPostPrice(accAddress, asset.TargetMarketCode, price, expiry)}

	// Initialize and validate the msg
	msgPostPrice := pftypes.NewMsgPostPrice(accAddress, asset.TargetMarketCode, price, expiry)
	err = msgPostPrice.ValidateBasic()
	if err != nil {
		return []sdk.Msg{}, err
	}

	msg := []sdk.Msg{msgPostPrice}

	return msg, nil
}
