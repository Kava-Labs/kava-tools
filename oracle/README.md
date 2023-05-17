# Oracle

Client software for running an oracle on the kava blockchain.

## How it works

At the specified crontab frequency, the oracle client will query the Binance v3 API for price information about that asset. If Binance is down, it will fallback to CoinGecko. If the price meets the threshold for posting (default is 0.5% change from the previous posted price), is will submit a `postprice` transaction to the blockchain along with a time when that price should be considered expired. At the end of each block, the median price of all oracles is selected as the asset's current price.


## Setup

### Install

Requirements:

* NodeJS - tested against version 10.x+
* yarn

```
yarn install
```

### Configure

Choose a key that you will use for the oracle. Make sure you have saved the mnemonic for that key and that the key has enough funds to pay transaction fees. Use discord to communicate with a team member to get your key included in a governance proposal to become an oracle on mainnet.

Setup a kava blockchain node with a REST endpoint. See [here](https://medium.com/kava-labs/kava-rest-server-guide-a13bdecfc5e4) for instructions.

Setup a `.env` file (see [the example](example-env))


### Run

```
yarn run oracle
```

#### Optionally Run With Systemd

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
