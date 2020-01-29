package socket

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

	"github.com/kava-labs/kava-tools/cmd/kvtools/txs"
	"github.com/kava-labs/kava-tools/cmd/kvtools/utils"
	"github.com/kava-labs/kava/x/auction/types"
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

				eventName := event.GetType()
				logger.Info("Event name:", eventName)

				switch eventName {
				// TODO: use coinDenom to determine if user is interested in this auction
				case types.EventTypeAuctionStart:
					logger.Info("New collateral auction started")
					auction, err := utils.GetEventAttributes(event.GetAttributes())
					if err != nil {
						logger.Error("%s", err)
					}
					logger.Info("%v", auction)

					bidDecision, err := readBidDecision()
					if err != nil {
						logger.Error("%s", err)
					}

					if bidDecision {
						msg := txs.PrepareBid(auction, accAddress)

						res, err := txs.SendTxRESTServer(
							chainID,
							cdc,
							accAddress,
							from,
							passphrase,
							cliCtx,
							[]sdk.Msg{msg},
							provider, // TODO: change to rest server
						)

						if err != nil {
							return err
						}

						fmt.Println(res.Logs)
					}
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

// readBidDecision reads the users bid decision input
func readBidDecision() (bool, error) {
	var placeBidDecision bool
	fmt.Println("Do you want to place a bid (y/n):")
	_, err := fmt.Scan(&placeBidDecision)
	if err != nil {
		return false, err
	}
	return placeBidDecision, nil
}
