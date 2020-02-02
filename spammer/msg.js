
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

//  "cdp/MsgDeposit"
// "cdp/MsgWithdraw"
// "cdp/MsgDrawDebt"
// "cdp/MsgRepayDebt"
