
export function newMsgPostPrice(address, marketID, currPrice) {
    // Expiration time = now + 1 hour
    var expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    // Remove ms from ISO format
    const expiryFormatted = expiry.toISOString().split('.')[0]+"Z";

    // Build msgPostPrice
    const msgPostPrice = {
        type: "pricefeed/MsgPostPrice",
        value: {
            from: address,
            market_id: marketID,
            price: currPrice,
            expiry: expiryFormatted
        }
    }

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
            ],
        }
    }
    return msgCreateCDP;
}

export function newMsgWithdraw(depositorAddress, ownerAddress, cDenom, cAmount) {
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
    }
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
    }
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
    }
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
    }
    return msgRepayDebt;
}