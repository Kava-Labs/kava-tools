# Oracle

Client software for running an oracle on the kava blockchain. Currently tested against kava-testnet-6000.

## Requirements

* NodeJS - tested against version 10.x+
* npm

## Setup

Choose a key that you will use for the oracle. Make sure you have saved the mnemonic for that key and that the key has enough funds to pay transaction fees. Use discord to communicate with a team member to get your key included in a governance proposal to become an oracle.

Setup a kava blockchain node with a REST endpoint. See [here](https://medium.com/kava-labs/kava-rest-server-guide-a13bdecfc5e4) for instructions.

Install the oracle software:

```
npm i
```


## Standalone Server Setup

Configure a `.env` file in `kava-tools/scripts` (see [example](example-env)) :

```
# the chain-id
CHAIN_ID="kava-testnet-6000"

# REST endpoint
LCD_URL="http://localhost:1317"

# Cron tab for how frequently prices will be posted (ex: 1 minute)
CRONTAB="* * * * *"

# bip39 mnemonic of oracle
MNEMONIC="secret words go here"

# List of markets the oracle will post prices for. See pricefeed parameters for the list of active markets.
MARKET_IDS="bnb:usd,bnb:usd:30"

# percentage deviation from previous price needed to trigger a new price - (example 0.5%)
DEVIATION="0.005"

# how long (in seconds) each price will remain valid - this value should be equal to the amount of time it takes for you to respond to a server outage (example 4 hours )
EXPIRY="14400"

# how long (in seconds) before the oracle will consider a price expiring and post a new price, regardless of the value of deviation.
# for example, if this is set to 600, the oracle will post a price any time the current posted price is expiring in less than 600 seconds.
EXPIRY_THRESHOLD="300"

# if the oracle should use the legacy HD path for kava (118). Setting to "true" will use 118, false will use 459
LEGACY_HD_PATH="false"
```

Setup a `systemd` file to run the oracle process. An example with user `ubuntu` is as follows (note that the `nodejs` process is at `/usr/bin/nodejs`, this may be different depending on how you install node ):

```
[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/kava-tools/scripts
ExecStart=/usr/bin/nodejs oracle.js
Restart=on-failure
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

Run the oracle process

```
sudo systemctl enable oracle.service
sudo systemctl start oracle.service
```

To view the logs of the oracle process:
```
sudo journalctl -u oracle -f
```

## Chainlink Node Setup

To run the oracle from a Chainlink node, you need to configure an external adapter for interacting with kava. Instructions can be found at [chainlink-adapter-kava](https://github.com/Kava-Labs/external-adapters-js/tree/master/kava)

## How it works

At the specified crontab frequency, the oracle client will query the Binance v3 API for price information about that asset. If Binance is down, it will fallback to CoinGecko. If the price meets the threshold for posting (default is 0.5% change from the previous posted price), is will submit a `postprice` transaction to the blockchain along with a time when that price should be considered expired. At the end of each block, the median price of all oracles is selected as the asset's current price.
