package main

import (
	"errors"
	"fmt"
	"path"
	"strconv"

	// "fmt"
	"log"
	"os"
	"strings"

	"github.com/jasonlvhit/gocron"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/client/keys"
	"github.com/cosmos/cosmos-sdk/client/rpc"
	sdk "github.com/cosmos/cosmos-sdk/types"

	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	amino "github.com/tendermint/go-amino"
	"github.com/tendermint/tendermint/libs/cli"

	"github.com/kava-labs/kava-tools/cmd/kvtools/socket"
	// "github.com/kava-labs/bidding/txs"
	"github.com/kava-labs/kava/app"
)

// FlagRPCURL specifies the url for kava's rpc
const FlagRPCURL = "rpc-url"

// FlagFrom specifies a moniker of an address on kava
const FlagFrom = "from"

var appCodec *amino.Codec

func main() {
	// Read in the configuration file for the sdk
	config := sdk.GetConfig()
	app.SetBech32AddressPrefixes(config)
	config.Seal()

	appCodec = app.MakeCodec()

	DefaultCLIHome := os.ExpandEnv("$HOME/.kvtools")

	// Add [--from], [--chain-id], [--rpc-url] to persistent flags and mark them required
	rootCmd.PersistentFlags().String(FlagFrom, "", "Moniker of address on Kava blockchain")
	rootCmd.PersistentFlags().String(client.FlagChainID, "", "Chain ID of tendermint node")
	rootCmd.PersistentFlags().String(FlagRPCURL, "", "RPC URL of tendermint node")
	rootCmd.PersistentPreRunE = func(_ *cobra.Command, _ []string) error {
		return initConfig(rootCmd)
	}

	auctionCmd.AddCommand(
		startBidding(),
	)

	pricefeedCmd.AddCommand(
		startPriceOracleCmd(),
	)

	// Construct root command
	rootCmd.AddCommand(
		rpc.StatusCommand(),
		auctionCmd,
		pricefeedCmd,
	)

	executor := cli.PrepareMainCmd(rootCmd, "KVTOOLS", DefaultCLIHome)
	err := executor.Execute()
	if err != nil {
		log.Fatal("failed executing CLI command", err)
	}
}

var rootCmd = &cobra.Command{
	Use:          "kvtools",
	Short:        "Tools and scripts for interaction with the Kava blockchain",
	SilenceUsage: true,
}

var pricefeedCmd = &cobra.Command{
	Use:          "pricefeed",
	Short:        "Pricefeed module related",
	SilenceUsage: true,
}

var auctionCmd = &cobra.Command{
	Use:          "auction",
	Short:        "Auction module related",
	SilenceUsage: true,
}

func startPriceOracleCmd() *cobra.Command {
	startPriceOracleCmd := &cobra.Command{
		Use:     "oracle [oracle-moniker] [coin1, coin2] [interval-minutes] --rpc-url=[rpc-url] --chain-id=[chain-id]",
		Short:   "Starts an oracle that automatically updates kava's price feed",
		Args:    cobra.ExactArgs(3),
		Example: "kvtools pricefeed oracle accA bitcoin,kava 30 --rpc-url=tcp://localhost:26657 --chain-id=testing",
		RunE:    RunStartPriceOracleCmd,
	}

	return startPriceOracleCmd
}

func startBidding() *cobra.Command {
	startBidding := &cobra.Command{
		Use:     "bidbot [coin-denom] --from=[moniker] --rpc-url=[rpc-url] --chain-id=[chain-id]",
		Short:   "Initalizes a bidding bot which places bids on auctions",
		Args:    cobra.ExactArgs(1),
		Example: "kvtools auction bidbot btc --from=vlad --rpc-url=tcp://localhost:26657 --chain-id=testing",
		RunE:    RunStartBidding,
	}

	return startBidding
}

// RunStartBidding runs start bidding cmd
func RunStartBidding(cmd *cobra.Command, args []string) error {
	// Parse from moniker URL
	from := viper.GetString(FlagFrom)
	if strings.TrimSpace(from) == "" {
		return errors.New("Must specify a 'from' moniker")
	}

	// Parse chain's ID
	chainID := viper.GetString(client.FlagChainID)
	if strings.TrimSpace(chainID) == "" {
		return errors.New("Must specify a 'chain-id'")
	}

	// Parse RPC URL
	rpcURL := viper.GetString(FlagRPCURL)
	if strings.TrimSpace(rpcURL) == "" {
		return errors.New("Must specify a 'rpc-url'")
	}

	coinDenom := args[0]
	if len(coinDenom) == 0 {
		return errors.New("Must specify a valid coin denom")
	}

	// Get the spammer's name and account address using their moniker
	accAddress, _, sdkErr := context.GetFromFields(from, false)
	if sdkErr != nil {
		return sdkErr
	}

	// Get the spammer's passphrase using their moniker
	passphrase, sdkErr := keys.GetPassphrase(from)
	if sdkErr != nil {
		return sdkErr
	}

	// Test passphrase is correct
	_, sdkErr = authtypes.MakeSignature(nil, from, passphrase, authtypes.StdSignMsg{})
	if sdkErr != nil {
		return sdkErr
	}

	// Set up our CLIContext
	cliCtx := context.NewCLIContext().
		WithCodec(appCodec).
		WithFromAddress(accAddress).
		WithFromName(from)

	err := socket.StartSubscription(
		rpcURL,
		chainID,
		from,
		passphrase,
		coinDenom,
		appCodec,
		cliCtx,
		accAddress,
	)

	if err != nil {
		return err
	}

	// auctions, err := txs.GetCurrentAuctions()
	// if err != nil {
	// 	return err
	// }

	// fmt.Println(auctions)

	return nil
}

// RunStartPriceOracleCmd runs the StartPriceOracleCmd
func RunStartPriceOracleCmd(cmd *cobra.Command, args []string) error {
	// Parse RPC URL
	rpcURL := viper.GetString(FlagRPCURL)
	if strings.TrimSpace(rpcURL) == "" {
		return errors.New("Must specify an 'rpc-url'")
	}

	// Parse chain's ID
	chainID := viper.GetString(client.FlagChainID)
	if strings.TrimSpace(chainID) == "" {
		return errors.New("Must specify a 'chain-id'")
	}

	// Parse the oracle's moniker
	oracleFrom := args[0]

	// Parse our coins
	coins := strings.Split(args[3], ",")
	if 1 > len(coins) {
		return errors.New("Must specify at least one coin")
	}

	// Parse the interval in minutes
	interval, err := strconv.Atoi(args[4])
	if err != nil {
		return err
	}
	if interval < 30 {
		return errors.New("Must specify an interval of 30 seconds or longer")
	}

	// Get the oracle's name and account address using their moniker
	accAddress, oracleName, sdkErr := context.GetFromFields(oracleFrom, false)
	if sdkErr != nil {
		return sdkErr
	}

	// Get the oracle's passphrase using their moniker
	passphrase, sdkErr := keys.GetPassphrase(oracleFrom)
	if sdkErr != nil {
		return sdkErr
	}

	// Test passphrase is correct
	_, sdkErr = authtypes.MakeSignature(nil, oracleFrom, passphrase, authtypes.StdSignMsg{})
	if sdkErr != nil {
		return sdkErr
	}

	// Set up our CLIContext
	cliCtx := context.NewCLIContext().
		WithCodec(appCodec).
		WithFromAddress(accAddress).
		WithFromName(oracleName)

	_ = cliCtx

	// Schedule cron for price collection and posting
	// gocron.Every(uint64(interval)).Seconds().Do(feed.ExecutePostingIteration, coins, accAddress, chainID, appCodec, oracleName, passphrase, cliCtx, rpcURL)
	gocron.Every(uint64(interval)).Seconds().Do(fmt.Println("PRINTPRINT"))
	<-gocron.Start()
	gocron.Clear()

	return nil
}

// KeysDir returns the path to the keys for this chain
func keysDir(home, chainID string) string {
	return path.Join(home, "keys", chainID)
}

func initConfig(cmd *cobra.Command) error {
	err := viper.BindPFlag(FlagFrom, cmd.PersistentFlags().Lookup(FlagFrom))
	if err != nil {
		return err
	}
	err = viper.BindPFlag(client.FlagChainID, cmd.PersistentFlags().Lookup(client.FlagChainID))
	if err != nil {
		return err
	}
	return viper.BindPFlag(FlagRPCURL, cmd.PersistentFlags().Lookup(FlagRPCURL))
}
