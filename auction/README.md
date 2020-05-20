# Auction Bot

Client software for a running an auction bot on the kava blockchain. Currently tested against kava-testnet-6000.

**Note** this is highly experimental software that requires a funded hot wallet to use. Running this software requires advanced technical skills and involves risks which are outside of the control of Kava Labs. Any use of this open source Apache 2.0 licensed software is done at your own risk and on a “AS IS” basis, without warranties or conditions of any kind, and any and all liability of Kava Labs for damages arising in connection to the software is excluded. Please exercise extreme caution!

## Requirements

- NodeJS - tested against version 10.x+
- yarn - tested against version 1.22.4

## How Auctions Work

Currently, this bot can be configured to participate in collateral auctions. Collateral auctions occur when a user's CDP has fallen below the required collateralization ratio and is liquidated. When this occurs, the kava protocol will initiate a collateral auction. An example collateral auction looks like:

```json
{
  "auction": {
    "type": "auction/CollateralAuction",
    "value": {
      "base_auction": {
        "id": "1",
        "initiator": "liquidator",
        "lot": {
          "denom": "bnb",
          "amount": "1000000000"
        },
        "bidder": "",
        "bid": {
          "denom": "usdx",
          "amount": "0"
        },
        "has_received_bids": false,
        "end_time": "9000-01-01T00:00:00Z",
        "max_end_time": "9000-01-01T00:00:00Z"
      },
      "corresponding_debt": {
        "denom": "debt",
        "amount": "90023612"
      },
      "max_bid": {
        "denom": "usdx",
        "amount": "94524793"
      },
      "lot_returns": {
        "addresses": ["kava1aphsdnz5hu2t5ty2au6znprug5kx3zpy6zwq29"],
        "weights": ["1000000000"]
      }
    }
  },
  "type": "collateral",
  "phase": "forward"
}
```

In this example auction, a lot of 10 BNB is being sold for a maximum bid of 94.5$ USDX.

Collateral auctions have two phases, forward and reverse. In the forward phase, bidders bid increasing amounts of USDX in exchange for the entire `lot`. Once the max bid is reached, the auction switches to the reverse phase. In the reverse phase, bidders bid decreasing lots of collateral (BNB in the example) they are willing to receive in exchange for `max_bid`. In the example, the `max_bid` is 94.5$ USDX for 10 BNB. At a current price of ~$16/BNB, the `max_bid` represents a considerable profit opportunity. Thus, a more competitive auction would expect to have `max_bid` reached and the final lot to be closer to 6 BNB, with the 4 remaining BNB returned to the original CDP holder.

## Standalone Server Setup

To run an auction bot, you need to acquire some USDX that will be used for bidding and load that USDX onto an account that your server has access to the mnemonic of. Practice extreme care in securing your server.

Configure a `.env` file in `kava-tools/scripts` (see [example](example-env)) :
This file configures what kind of collateral auctions the bot will bid on and what profit margins the bot will attempt to make.

```env

#-------------------------Kava blockchain config----------------
# REST endpoint - the REST endpoint of the kava blockchain node you will communicate with
LCD_URL="http://54.196.2.124:1317"
# bip39 mnemonic of bidder
MNEMONIC="secret words go here"

#-------------------------Global auction config----------------

# comma-separated list of auction types this bot will participate in
# "Collateral,Debt,Surplus"
AUCTION_TYPES="Collateral"

# comma-separated list of addresses that the bot will not bid against (you don't need to include the address associated with your mnemonic, the bot will not bid against itself)
IGNORED_ADDRESSES="kava1aphsdnz5hu2t5ty2au6znprug5kx3zpy6zwq29"

#---------------------------collateral auction options-----------------

# comma-separated list of collateral types that the auction bot will participate in
COLLATERALS="bnb"

# Percentage of the max bid that the bot will bid
# NOTE: collateral auctions have a forward and reverse phase. Bidding 'max_bid' will trigger the auction to enter reverse phase. Bidding the max_bid is generally a significant discount to the underlying collateral value. For example, if $150 of collateral was backing $100 in debt, max_bid would be ~$100. If the value of the collateral has decreased by 10% due to market volatility, bidding max_bid and winning would have an expected value of $135. Theoretically, lower values of this parameter should result in winning fewer auctions. If this is set below one, the bot will never make bids on collateral auctions in the reverse phase
FORWARD_BID_MAX="1"

# Note, margin is determined by querying the Binance v3 exchange API for the current spot price of the collateral asset. If Binance is not responding, CoinGecko is used as a backup.

# the minimum expected margin (as a percentage) for placing a forward bid
# Example: Setting this to 0.1 is the equivalent of saying only bid $100 if the current value of the collateral is $110.
# Theoretically, higher values of this parameter should result in fewer winning auctions.
FORWARD_BID_MARGIN="0.05"

# the minimum expected margin (as a percentage) for placing a reverse bid
# Example: Setting this to 0.1 is the equivalent of saying only accept lots that are currently worth $110 if the bid is at or below $100
# Theoretically, higher values of this parameter should result in fewer winning  auctions
REVERSE_BID_MARGIN="0.05"

# Cron tab for how frequently auctions will be checked
CRONTAB="*/30 * * * * *"
```

Setup a `systemd` file to run the auction process. An example with user `ubuntu` is as follows (note that the `nodejs` process is at `/usr/bin/nodejs`, this may be different depending on how you install node ):

```
[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/kava-tools/scripts
ExecStart=/usr/bin/nodejs auction.js
Restart=on-failure
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

Run the auction process

```
sudo systemctl enable auction.service
sudo systemctl start auction.service
```

To view the logs of the auction process:
```
sudo journalctl -u auction -f
```

## How it works

At the specified crontab frequency, the auction client will query the kava blockchain for ongoing auctions. Using the configured parameters, it will bid on auctions if they meet the requirements. For purposes of determining margin, the client queries the Binance v3 exchange API for the current spot price of the collateral asset. If Binance is not responding, CoinGecko is used as a backup.
