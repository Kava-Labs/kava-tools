package auction

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	sdkContext "github.com/cosmos/cosmos-sdk/client/context"
	sdk "github.com/cosmos/cosmos-sdk/types"
	amino "github.com/tendermint/go-amino"
	tmLog "github.com/tendermint/tendermint/libs/log"
	tmClient "github.com/tendermint/tendermint/rpc/client"
	tmTypes "github.com/tendermint/tendermint/types"

	"github.com/kava-labs/kava-tools/cmd/kvtools/common/txs"
	"github.com/kava-labs/kava/x/auction/types"
	auctypes "github.com/kava-labs/kava/x/auction/types"
)

// StartSubscription starts a subscription to the tendermint node
func StartSubscription(
	provider string,
	chainID string,
	from string,
	passphrase string,
	coinDenom string,
	cdc *amino.Codec,
	cliCtx sdkContext.CLIContext,
	accAddress sdk.AccAddress,
) error {
	logger := tmLog.NewTMLogger(tmLog.NewSyncWriter(os.Stdout))
	client := tmClient.NewHTTP(provider, "/websocket")

	client.SetLogger(logger)

	err := client.Start()
	if err != nil {
		logger.Error("Failed to start a client", "err", err)
		os.Exit(1)
	}

	defer client.Stop()

	// Subscribe to all tendermint transactions
	query := "tm.event = 'Tx'"

	out, err := client.Subscribe(context.Background(), "test", query, 1000)
	if err != nil {
		logger.Error("Failed to subscribe to query", "err", err, "query", query)
		os.Exit(1)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	for {
		select {
		case result := <-out:
			tx, ok := result.Data.(tmTypes.EventDataTx)
			if !ok {
				logger.Error("Type casting failed while extracting event data from new tx")
			}

			logger.Info("New transaction witnessed")

			// Iterate over each event inside of the transaction
			for _, event := range tx.Result.Events {
				// TODO: remove -> logger.Info(fmt.Sprintf("%v", reflect.TypeOf(event)))

				eventName := event.GetType()
				logger.Info("Event name:", eventName)

				// TODO: use coinDenom to determine if user is interested in this auction

				switch eventName {
				case types.EventTypeAuctionStart:
					handleAuctionStart(logger, chainID, cdc, accAddress, from, passphrase, cliCtx, provider) // TODO: event
				case types.EventTypeAuctionBid:
					logger.Info("Bid placed!")
				case types.EventTypeAuctionClose:
					logger.Info("Auction closed!")
				}
			}
		case <-quit:
			os.Exit(0)
		}
	}
}

func handleAuctionStart(
	// event sdk.EventDataTx,
	logger tmLog.Logger,
	chainID string,
	cdc *amino.Codec,
	accAddress sdk.AccAddress,
	from string,
	passphrase string,
	cliCtx sdkContext.CLIContext,
	provider string,
) error {
	logger.Info("New collateral auction started")

	// Get event attributes
	// auction, err := GetEventAttributes(event.GetAttributes())
	// if err != nil {
	// 	logger.Error("%s", err)
	// }
	// logger.Info("%v", auction)

	// Scan user's bid decision
	bidDecision, err := ScanBidDecision()
	if err != nil {
		logger.Error("%s", err)
	}

	if bidDecision {
		// Scan user's bid coin
		bidCoin, err := ScanBidCoin()

		// Package as MsgPlaceBid
		// msgPlaceBid := auctypes.NewMsgPlaceBid(auction.ID, accAddress, bidCoin)
		msgPlaceBid := auctypes.NewMsgPlaceBid(0, accAddress, bidCoin)

		// TODO: change to rest server
		res, err := txs.SendTxRPC(chainID, cdc, accAddress, from, passphrase, cliCtx, []sdk.Msg{msgPlaceBid}, provider)
		if err != nil {
			return err
		}

		// TODO: Check formatting
		logger.Info(fmt.Sprintf("%v", res.Logs))
	}
	return nil
}
