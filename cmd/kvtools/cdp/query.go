package cdp

import (
	"fmt"

	"github.com/cosmos/cosmos-sdk/client/context"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	cdptypes "github.com/kava-labs/kava/x/cdp/types"
)

// QueryCDP queries an individual CDP
func QueryCDP(cdc *codec.Codec,
	cliCtx context.CLIContext,
	accAddress sdk.AccAddress,
	collateralDenom string,
) (cdptypes.CDP, bool, error) {

	bz, err := cdc.MarshalJSON(cdptypes.QueryCdpParams{
		CollateralDenom: collateralDenom,
		Owner:           accAddress,
	})
	if err != nil {
		return cdptypes.CDP{}, false, err
	}

	// Query
	route := fmt.Sprintf("custom/cdp/cdp")
	res, _, err := cliCtx.QueryWithData(route, bz)
	if err != nil {
		return cdptypes.CDP{}, false, err
	}

	// Decode and print results
	var cdp cdptypes.CDP
	cdc.MustUnmarshalJSON(res, &cdp)
	return cdp, true, nil
}
