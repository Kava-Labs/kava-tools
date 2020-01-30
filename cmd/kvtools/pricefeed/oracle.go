package pricefeed

import (
	"fmt"
	"time"

	"github.com/matryer/try"

	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/x/auth/client/utils"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"

	pftypes "github.com/kava-labs/kava/x/pricefeed/types"
)

// ExecutePostingIteration gets the current coin prices and posts them to kava
func ExecutePostingIteration(
	coins []string,
	accAddress sdk.AccAddress,
	chainID string,
	cdc *codec.Codec,
	oracleName string,
	passphrase string,
	cliCtx context.CLIContext,
	rpcURL string,
) error {
	assets := GetCoinGeckoPrices(coins, "USD")

	fmt.Printf("assets: %v\n", assets)

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
			} else {
				fmt.Printf("\t\tLogs unavailable.\n")
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
	cdc *codec.Codec,
	from string,
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
		// --------------------------------------------
		// TODO: REMOVE
		// --------------------------------------------
		price, err := sdk.NewDecFromStr(fmt.Sprintf("%f", asset.Price))
		if err != nil {
			fmt.Println(fmt.Sprintf("%s", err))
			// return sdk.TxResponse{}, err
		}

		// Set expiration time to 1 day in the future
		expiry := time.Now().Add(24 * time.Hour)

		// Initialize and validate the msg
		msg := pftypes.NewMsgPostPrice(accAddress, asset.TargetMarketCode, price, expiry)
		err = msg.ValidateBasic()
		if err != nil {
			fmt.Println(fmt.Sprintf("%s", err))
		}
		// --------------------------------------------

		// msg, err := buildPostPrice(asset, accAddress)
		// if err != nil {
		// 	fmt.Printf(fmt.Sprintf("Error constructing msg: %s", err))
		// }

		fmt.Printf("\t%d. %s: posting price %f...%s\n", num, asset.Symbol, asset.Price, attemptStr)

		// Attempt to send msg to blockchain
		txRes, err = sendTxPostPrice(chainID, cdc, accAddress, from, passphrase, cliCtx, &msg, rpcURL)
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
func buildPostPrice(asset Asset, accAddress sdk.AccAddress) (pftypes.MsgPostPrice, error) {
	// Parse the price
	price, err := sdk.NewDecFromStr(fmt.Sprintf("%f", asset.Price))
	if err != nil {
		// return []sdk.Msg{}, err
		return pftypes.MsgPostPrice{}, err
	}
	// Set expiration time to 1 day in the future
	expiry := time.Now().Add(24 * time.Hour)

	// Build new MsgPostPrice
	msgPostPrice := pftypes.NewMsgPostPrice(accAddress, asset.TargetMarketCode, price, expiry)
	err = msgPostPrice.ValidateBasic()
	if err != nil {
		// return []sdk.Msg{}, err
		return pftypes.MsgPostPrice{}, err
	}

	return msgPostPrice, nil
	// return []sdk.Msg{msgPostPrice}, nil
}

// sendTxPostPrice sends a tx containing MsgPostPrice to the kava blockchain
func sendTxPostPrice(
	chainID string,
	cdc *codec.Codec,
	accAddress sdk.AccAddress,
	moniker string,
	passphrase string,
	cliCtx context.CLIContext,
	msg *pftypes.MsgPostPrice,
	rpcURL string,
) (sdk.TxResponse, error) {
	if rpcURL != "" {
		cliCtx = cliCtx.WithNodeURI(rpcURL)
	}

	cliCtx.SkipConfirm = true

	txBldr := authtypes.NewTxBuilderFromCLI().
		WithTxEncoder(utils.GetTxEncoder(cdc)).
		WithChainID(chainID)

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
	txBytes, err := txBldr.BuildAndSign(moniker, passphrase, []sdk.Msg{msg})
	if err != nil {
		return sdk.TxResponse{}, err
	}

	// Broadcast to a Tendermint node
	res, err := cliCtx.BroadcastTxCommit(txBytes)
	if err != nil {
		return sdk.TxResponse{}, err
	}

	return res, nil
}
