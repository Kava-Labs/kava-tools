import SHA256 from "crypto-js/sha256";
import { decodeAddress } from "./crypto.js";
import hexEncoding from "crypto-js/enc-hex";

/**
 * Computes a single SHA256 digest.
 * @param {string} hex message to hash
 * @returns {string} hash output
 */
export const sha256 = hex => {
  if (typeof hex !== "string") throw new Error("sha256 expects a hex string");
  if (hex.length % 2 !== 0)
    throw new Error(`invalid hex string length: ${hex}`);
  const hexEncoded = hexEncoding.parse(hex);
  return SHA256(hexEncoded).toString();
};

/**
 * Computes sha256 of random number and timestamp
 * @param {String} randomNumber
 * @param {Number} timestamp
 * @returns {string} sha256 result
 */
export const calculateRandomNumberHash = (randomNumber, timestamp) => {
  const timestampHexStr = timestamp.toString(16);
  let timestampHexStrFormat = timestampHexStr;
  for (let i = 0; i < 16 - timestampHexStr.length; i++) {
    timestampHexStrFormat = "0" + timestampHexStrFormat;
  }
  const timestampBytes = Buffer.from(timestampHexStrFormat, "hex");
  const newBuffer = Buffer.concat([
    Buffer.from(randomNumber, "hex"),
    timestampBytes
  ]);
  return sha256(newBuffer.toString("hex"));
};

/**
 * Computes swapID
 * @param {String} randomNumberHash
 * @param {String} sender
 * @param {String} senderOtherChain
 * @returns {string} sha256 result
 */
export const calculateSwapID = (randomNumberHash, sender, senderOtherChain) => {
  const randomNumberHashBytes = Buffer.from(randomNumberHash, "hex");
  const senderBytes = decodeAddress(sender);
  const sendOtherChainBytes = Buffer.from(
    senderOtherChain.toLowerCase(),
    "utf8"
  );
  const newBuffer = Buffer.concat([
    randomNumberHashBytes,
    senderBytes,
    sendOtherChainBytes
  ]);
  return sha256(newBuffer.toString("hex"));
};
