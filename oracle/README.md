# Oracle

Client software for running an oracle on the kava blockchain. Currently tested against kava-testnet-4000.

## Requirements

* NodeJS - tested against version 8.10.0+
* npm

## Setup

Choose a key that you will use for the oracle. Make sure you have saved the mnemonic for that key and that the key has enough funds to pay transaction fees. Use riot or telegram to communicate with a team member to get your key included in a governance proposal to become an oracle.

Setup a kava blockchain node with a REST endpoint. See [here](https://medium.com/kava-labs/kava-rest-server-guide-a13bdecfc5e4) for instructions.

Install the oracle software:

```
npm i
```

Configure the `.env` file in `kava-tools/oracle`:

```
# Chain id of the kava blockchain
CHAIN_ID="testing"
# REST endpoint the oracle will use to post transactions
LCD_URL = "http://localhost:1317"
# Cron tab for how frequently prices will be posted (ex: 10 minutes)
CRONTAB = "*/10 * * * *"
# bip39 mnenomic of oracle
MNEMONIC = "equip town gesture square tomorrow volume nephew minute witness beef rich gadget actress egg sing secret pole winter alarm law today check violin uncover"

# markets that the oracle will post prices for. See `pricefeed` parameters for the list of active markets.
MARKET_IDS = "xrp:usd,btc:usd"
```

Setup a `systemd` file to run the oracle process. An example with user `ubuntu` is as follows:

```
[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/kava-tools/oracle
ExecStart=/usr/bin/nodejs start.js
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

To view the logs or the oracle process:
```
sudo journalctl -u oracle -f

## How it works

At the specified frequency, the oracle client will query the coin gecko API for price information about that asset. It will post a transaction to the kava blockchain with that price, along with an expiry for how long that price is valid. At each block, the median price of all oracles is selected.