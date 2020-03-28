require("dotenv").config();
const cosmosjs = require("@cosmostation/cosmosjs");

import { postTxKava, getTxKava } from "../common/txs.js";
import {
  newMsgCreateAtomicSwap,
  newMsgClaimAtomicSwap,
  newMsgRefundAtomicSwap
} from "../common/msg.js";
import { calculateRandomNumberHash } from "./utils.js";

// Load chain details, credentials
// const lcdURL = process.env.LCD_URL;
// const chainID = process.env.CHAIN_ID;
// const userMnemonic = process.env.USER_MNEMONIC;

const url = "http://localhost:1317";
const chainID = "testing";

// mnemonic and address for user 'sample'
const sampleKavaAddr = "kava1c84ezutjcgrsxarjq5mzsxxz2k9znn94zxmqjz";
const sampleKavaMnemonic =
  "panda pause loan decorate faculty arrive segment couple cupboard border fortune sort indoor degree game shrug sight excuse palm teach shock liar youth panda";

const deputyKavaAddr = "kava1sl8glhaa9f9tep0d9h8gdcfmwcatghtdrfcd2x";
const deputyKavaMnemonic =
  "slab twist stumble inmate predict parent repair crystal celery swarm memory loan rabbit blanket shell talk attend charge inside denial harbor music board steak";

const deputyBNBAddr = "tbnb10uypsspvl6jlxcx5xse02pag39l8xpe7a3468h";
const deputyBNBMnemonic =
  "assault van obtain draw anger wait price case clinic prison twice history recall audit solar body load theme valley side help school push replace";

const userBnbAddr = "tbnb17vwyu8npjj5pywh3keq2lm7d4v76n434pwd8av";
const userBnbMnemonic =
  "lawsuit margin siege phrase fabric matrix like picnic day thrive correct velvet stool type broom upon flee fee ten senior install wrestle soap sick";

var main = async () => {
  // Initiate Kava blockchain
  const kava = cosmosjs.network(url, chainID);
  kava.setBech32MainPrefix("kava");
  kava.setPath("m/44'/459'/0'/0/0");

  // Load account credentials
  const address = kava.getAddress(deputyKavaMnemonic);
  const ecpairPriv = kava.getECPairPriv(deputyKavaMnemonic);

  sendCoins(kava, address, ecpairPriv);
  // createAtomicSwap(kava, address, ecpairPriv);
  // refundAtomicSwap(kava, address, ecpairPriv);
  // claimAtomicSwap(kava, address, ecpairPriv);
};

var sendCoins = (kava, address, ecpairPriv) => {
  kava.getAccounts(address).then(data => {
    let stdSignMsg = kava.newStdMsg({
      msgs: [
        {
          type: "cosmos-sdk/MsgSend",
          value: {
            amount: [
              {
                amount: String(100000), // 6 decimal places (1000000 ukava = 1 KAVA)
                denom: "ukava"
              }
            ],
            from_address: address,
            to_address: "kava1sl8glhaa9f9tep0d9h8gdcfmwcatghtdrfcd2x"
          }
        }
      ],
      chain_id: chainID,
      fee: {
        amount: [{ amount: String(5000), denom: "ukava" }],
        gas: String(200000)
      },
      memo: "",
      account_number: String(data.result.value.account_number),
      sequence: String(data.result.value.sequence)
    });

    console.log("Attempting to post to kava...");
    const signedTx = kava.sign(stdSignMsg, ecpairPriv);
    kava.broadcast(signedTx).then(response => console.log(response));
  });
};

var createAtomicSwap = (kava, address, ecpairPriv) => {
  const randomNumber =
    "e8eae926261ab77d018202434791a335249b470246a7b02e28c3b2fb6ffad8f3"; // 32 bytes random number
  const timestamp = Math.floor(Date.now() / 1000);
  const randomNumberHash = calculateRandomNumberHash(randomNumber, timestamp);

  console.log("Random number:", randomNumber);
  console.log("Timestamp:", timestamp);
  console.log("Random number hash:", randomNumberHash);
  console.log();

  kava.getAccounts(address).then(data => {
    let stdSignMsg = kava.newStdMsg({
      msgs: [
        {
          type: "bep3/MsgCreateAtomicSwap",
          value: {
            from: address,
            to: sampleKavaAddr,
            recipient_other_chain: userBnbAddr,
            sender_other_chain: deputyBNBAddr,
            random_number_hash: randomNumberHash,
            timestamp: String(timestamp),
            amount: [
              {
                amount: String(100000),
                denom: "bnb"
              }
            ],
            expected_income: String(100000).concat("bnb"),
            height_span: "360",
            cross_chain: true
          }
        }
      ],
      chain_id: "testing",
      fee: {
        amount: [{ amount: String(5000), denom: "ukava" }],
        gas: String(250000)
      },
      memo: "",
      account_number: String(data.result.value.account_number),
      sequence: String(data.result.value.sequence)
    });

    console.log(stdSignMsg.json.msgs);
    console.log("Attempting to post to kava...");

    const signedTx = kava.sign(stdSignMsg, ecpairPriv);
    kava.broadcast(signedTx).then(response => console.log(response));
  });
};

var refundAtomicSwap = (kava, address, ecpairPriv) => {
  kava.getAccounts(address).then(data => {
    let stdSignMsg = kava.newStdMsg({
      msgs: [
        {
          type: "bep3/MsgRefundAtomicSwap",
          value: {
            from: address,
            swap_id:
              "53331FE751C7D650BB8D6133212C0BCC0E5D22C694C195D1A5F6ABE8391B73DF"
          }
        }
      ],
      chain_id: chainID,
      fee: {
        amount: [{ amount: String(5000), denom: "ukava" }],
        gas: String(250000)
      },
      memo: "",
      account_number: String(data.result.value.account_number),
      sequence: String(data.result.value.sequence)
    });

    console.log(stdMsgCreate.json.msgs);
    console.log("Attempting to post to kava...");

    const signedTx = kava.sign(stdSignMsg, ecpairPriv);
    kava.broadcast(signedTx).then(response => console.log(response));
  });
};

var claimAtomicSwap = async (kava, address, ecpairPriv) => {
  kava.getAccounts(address).then(data => {
    const swapID =
      "2c7b6c24d29e7fa0c85a78ce6e6ada2ad9c71ea81411b247fb2d18b90123cdd1";
    const randomNumber =
      "68d283193c200fb578e90329d002ca0a31155dbe78eccbe7fd91390c201da2a2";
    let stdSignMsg = kava.newStdMsg({
      msgs: [
        {
          type: "bep3/MsgRefundAtomicSwap",
          value: {
            from: address,
            swap_id: swapID,
            random_number: randomNumber
          }
        }
      ],
      chain_id: chainID,
      fee: {
        amount: [{ amount: String(5000), denom: "ukava" }],
        gas: String(250000)
      },
      memo: "",
      account_number: String(data.result.value.account_number),
      sequence: String(data.result.value.sequence)
    });
    console.log(stdMsgCreate.json.msgs);
    console.log("Attempting to post to kava...");

    const signedTx = kava.sign(stdSignMsg, ecpairPriv);
    kava.broadcast(signedTx).then(response => console.log(response));
  });
};

main();

// ------------------------------------
//       Another way to post txs:
// ------------------------------------
// Post the tx to kava
//   postTxKava(
//     kava,
//     chainID,
//     account_number,
//     sequence,
//     ecpairPriv,
//     msgRefundAtomicSwap
//   ).then(async tx_hash => {
//     await new Promise(resolve => setTimeout(resolve, 10000));
//     // Get tx info by hash and print
//     getTxKava(lcdURL, "/txs/".concat(tx_hash), {}).then(data => {
//       console.log(`Tx Result for ${tx_hash}: ${data.raw_log}\n`);
//     });
//   });
//   await new Promise(resolve => setTimeout(resolve, 10000));
