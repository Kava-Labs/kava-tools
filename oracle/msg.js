
export function newMsgPostPrice(msgType, address, marketID, currPrice) {
    // Expiration time = now + 1 hour
    var expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    // Remove ms from ISO format
    const expiryFormatted = expiry.toISOString().split('.')[0]+"Z";

    // Build msgPostPrice
    const msgPostPrice = {
        type: msgType,
        value: {
            from: address,
            market_id: marketID,
            price: currPrice,
            expiry: expiryFormatted
        }
    }

    return msgPostPrice;
}
