package pricefeed

import (
	"fmt"
	"time"

	"github.com/matryer/try"

	"github.com/cosmos/cosmos-sdk/client/context"
	sdk "github.com/cosmos/cosmos-sdk/types"
	amino "github.com/tendermint/go-amino"

	"github.com/kava-labs/kava-tools/cmd/kvtools/common/txs"
	pftypes "github.com/kava-labs/kava/x/pricefeed/types"
)

// ExecutePostingIteration gets the current coin prices and posts them to kava
func ExecutePostingIteration(
	coins []string,
	accAddress sdk.AccAddress,
	chainID string,
	cdc *amino.Codec,
	oracleName string,
	passphrase string,
	cliCtx context.CLIContext,
	rpcURL string,
) error {
	assets := GetCoinGeckoPrices(coins, "USD")

	fmt.Println("Time: ", time.Now().Format("15:04:05"))
	for i := 0; i < len(assets); i++ {
		txRes, err := attemptPostPrice(i+1, assets[i], accAddress, chainID, cdc, oracleName, passphrase, cliCtx, rpcURL)

		if err != nil {
			fmt.Printf("Error: %v", err)
		} else {
			fmt.Printf("\t\tTx hash: %s\n", txRes.TxHash)
			if len(txRes.Logs) > 0 {
				if txRes.Logs[0].Success {
					fmt.Printf("\t\tPrice successfully posted.\n")
				} else {
					fmt.Printf("\t\tUnsuccessful. %v\n", txRes.Logs[0].Log)
				}
			}
		}
	}
	fmt.Println()
	return nil
}

// postPrice attempts to send MsgPostPrice. If unsuccessful due to local errors, it will
// attempt again for a total of 3 attempts. If the tx is received by the blockchain but unsuccessful
// due to blockchain state, it will not try to resend the tx - but will print the tx log text.
func attemptPostPrice(
	num int,
	asset Asset,
	accAddress sdk.AccAddress,
	chainID string,
	cdc *amino.Codec,
	oracleName string,
	passphrase string,
	cliCtx context.CLIContext,
	rpcURL string,
) (sdk.TxResponse, error) {
	var txRes sdk.TxResponse
	err := try.Do(func(attempt int) (bool, error) {
		var err error
		// Format attempt
		attemptStr := ""
		if attempt > 1 {
			attemptStr = fmt.Sprintf(" [attempt #%d]", attempt)
		}

		// Build the msg
		msg, _ := buildPostPrice(asset, accAddress)

		fmt.Printf("\t%d. %s: posting price %f...%s\n", num, asset.Symbol, asset.Price, attemptStr)

		// Attempt to send msg to blockchain
		txRes, err = txs.SendTxRPC(chainID, cdc, accAddress, oracleName, passphrase, cliCtx, msg, rpcURL)
		if err != nil {
			time.Sleep(7 * time.Second) // wait 7 seconds
		}
		return attempt < 3, err // try 3 times
	})

	if err != nil {
		return sdk.TxResponse{}, err
	}

	return txRes, err
}

// buildPostPrice builds a MsgPostPrice
func buildPostPrice(asset Asset, accAddress sdk.AccAddress) ([]sdk.Msg, error) {
	// Parse the price
	price, err := sdk.NewDecFromStr(fmt.Sprintf("%f", asset.Price))
	if err != nil {
		return []sdk.Msg{}, err
	}
	// Set expiration time to 1 day in the future
	expiry := time.Now().Add(24 * time.Hour)
	// Build MsgPostPrice
	msg := []sdk.Msg{pftypes.NewMsgPostPrice(accAddress, asset.TargetMarketCode, price, expiry)}
	return msg, nil
}
