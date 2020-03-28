export function newMsgPostPrice(address, marketID, currPrice) {
  // Expiration time = now + 1 hour
  var expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  // Remove ms from ISO format
  const expiryFormatted = expiry.toISOString().split(".")[0] + "Z";

  // Build msgPostPrice
  const msgPostPrice = {
    type: "pricefeed/MsgPostPrice",
    value: {
      from: address,
      market_id: marketID,
      price: currPrice,
      expiry: expiryFormatted
    }
  };

  return msgPostPrice;
}

export function newMsgCreateCDP(address, cDenom, cAmount, pDenom, pAmount) {
  const msgCreateCDP = {
    type: "cdp/MsgCreateCDP",
    value: {
      sender: address,
      collateral: [
        {
          amount: String(cAmount),
          denom: cDenom
        }
      ],
      principal: [
        {
          amount: String(pAmount),
          denom: pDenom
        }
      ]
    }
  };
  return msgCreateCDP;
}

export function newMsgWithdraw(
  depositorAddress,
  ownerAddress,
  cDenom,
  cAmount
) {
  const msgWithdraw = {
    type: "cdp/MsgWithdraw",
    value: {
      depositor: depositorAddress,
      owner: ownerAddress,
      collateral: [
        {
          amount: String(cAmount),
          denom: cDenom
        }
      ]
    }
  };
  return msgWithdraw;
}

export function newMsgDeposit(ownerAddress, depositorAddress, cDenom, cAmount) {
  const msgDeposit = {
    type: "cdp/MsgDeposit",
    value: {
      owner: ownerAddress,
      depositor: depositorAddress,
      collateral: [
        {
          amount: String(cAmount),
          denom: cDenom
        }
      ]
    }
  };
  return msgDeposit;
}

export function newMsgDrawDebt(address, cDenom, pDenom, pAmount) {
  const msgDrawDebt = {
    type: "cdp/MsgDrawDebt",
    value: {
      sender: address,
      cdp_denom: cDenom,
      principal: [
        {
          amount: String(pAmount),
          denom: pDenom
        }
      ]
    }
  };
  return msgDrawDebt;
}

export function newMsgRepayDebt(address, cDenom, pDenom, pAmount) {
  const msgRepayDebt = {
    type: "cdp/MsgRepayDebt",
    value: {
      sender: address,
      cdp_denom: cDenom,
      payment: [
        {
          amount: String(pAmount),
          denom: pDenom
        }
      ]
    }
  };
  return msgRepayDebt;
}

export function newMsgRefundAtomicSwap(sender, swapID) {
  const msgRefundAtomicSwap = {
    type: "bep3/MsgRefundAtomicSwap",
    value: {
      from: sender,
      swap_id: swapID
    }
  };
  return msgRefundAtomicSwap;
}

export function newMsgClaimAtomicSwap(sender, swapID, randomNumber) {
  const msgClaimAtomicSwap = {
    type: "bep3/MsgClaimAtomicSwap",
    value: {
      from: String(sender),
      swap_id: String(swapID),
      random_number: String(randomNumber)
    }
  };
  return msgClaimAtomicSwap;
}

// TODO: This results in 'undefined'
export function newMsgCreateAtomicSwap(
  sender,
  recipient,
  recipientOtherChain,
  senderOtherChain,
  randomNumberHash,
  timestamp,
  amount,
  denom,
  heightSpan,
  crossChain
) {
  const msgCreateAtomicSwap = {
    type: "bep3/MsgCreateAtomicSwap",
    value: {
      from: String(sender),
      to: String(recipient),
      recipient_other_chain: String(recipientOtherChain),
      sender_other_chain: String(senderOtherChain),
      random_number_hash: String(randomNumberHash),
      timestamp: String(timestamp),
      amount: [
        {
          amount: String(amount),
          denom: denom
        }
      ],
      expected_income: String(amount).concat(denom),
      height_span: String(heightSpan),
      cross_chain: String(crossChain)
    }
  };
  return msgCreateAtomicSwap;
}
