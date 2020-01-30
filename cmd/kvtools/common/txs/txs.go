package txs

import (
	"fmt"

	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/x/auth/client/utils"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	pftypes "github.com/kava-labs/kava/x/pricefeed/types"
	amino "github.com/tendermint/go-amino"
)

// Gas is set to a large amount to ensure successful tx sending
const Gas = 500000

// SendTxRPC sends a tx containing a sdk.Msg to the kava blockchain
func SendTxRPC(
	chainID string,
	cdc *amino.Codec,
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

	fmt.Println("txBldr:", txBldr)

	accountRetriever := authtypes.NewAccountRetriever(cliCtx)

	fmt.Println("accountRetriever:", accountRetriever)

	err := accountRetriever.EnsureExists(accAddress)
	if err != nil {
		fmt.Println("Error1")
		return sdk.TxResponse{}, err
	}

	// Prepare tx
	txBldr, err = utils.PrepareTxBuilder(txBldr, cliCtx)
	if err != nil {
		fmt.Println("Error2")
		return sdk.TxResponse{}, err
	}

	fmt.Println("txBldrPrepared:", txBldr)

	// Build and sign the transaction
	txBytes, err := txBldr.BuildAndSign(moniker, passphrase, msg)
	if err != nil {
		fmt.Println("Error3")
		return sdk.TxResponse{}, err
	}

	fmt.Println("txBytes:", txBytes)

	// Broadcast to a Tendermint node
	res, err := cliCtx.BroadcastTxCommit(txBytes)
	if err != nil {
		fmt.Println("Error4")
		return sdk.TxResponse{}, err
	}

	fmt.Println("res:", res)

	return res, nil
}

// SendTxRESTServer sends a tx containing to the kava blockchain via the REST server
// TODO: func SendTxRESTServer() {}

// SendTxPostPrice sends a tx containing MsgPostPrice to the kava blockchain
func SendTxPostPrice(
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
