import "mocha";
mocha.setup("bdd");

import { Streebog256HMAC, Streebog512HMAC } from "@globalart/crypto-streebog";
import { expect } from "chai";
import { KeyUtilities } from "../models/key-utilities";
import { OTPAlgorithm, OTPType, OTPUtil } from "../models/otp";

describe("Test GOST 2012", async () => {
  const secret: string = getRandomHEXString(32);
  const counter: number = calculateCounter(new Date());
  await testAlgorithm(secret, counter, OTPAlgorithm.GOST3411_2012_256);
  await testAlgorithm(secret, counter, OTPAlgorithm.GOST3411_2012_512);
});

function calculateCounter(date: Date) {
  const epoch: number = Math.round(date.getTime() / 1000.0);
  const period: number = 30;
  return Math.floor(epoch / period);
}

async function testAlgorithm(
  secret: string,
  counter: number,
  algorithm: OTPAlgorithm,
) {
  const previousCounter = counter - 1;
  const key = new Uint8Array(parseHexString(secret));
  const hmac =
    algorithm === OTPAlgorithm.GOST3411_2012_256
      ? Streebog256HMAC
      : Streebog512HMAC;
  //current counter
  const signatureArray = hmac(key)
    .update(new Uint8Array(counterToArray(counter)))
    .digest();
  const signature = toHexString(signatureArray);
  const otp = getOtp(signature);
  //previous counter
  const prevSignatureArray = hmac(key)
    .update(new Uint8Array(counterToArray(previousCounter)))
    .digest();
  const prevSignature = toHexString(prevSignatureArray);
  const previousOtp = getOtp(prevSignature);
  //check hash algorithm
  it(
    "(" +
      OTPAlgorithm[algorithm] +
      ") " +
      "hash from secret '" +
      secret +
      "' and counter '" +
      counter +
      "' = '" +
      signature +
      "', verifying",
    () => {
      expect(signature).to.have.length(
        OTPUtil.getOTPAlgorithmSpec(algorithm).length / 4,
      );
    },
  );
  //check previous hash algorithm
  it(
    "(" +
      OTPAlgorithm[algorithm] +
      ") " +
      "hash from secret '" +
      secret +
      "' and counter '" +
      previousCounter +
      "' = '" +
      prevSignature +
      "', verifying",
    () => {
      expect(prevSignature).to.have.length(
        OTPUtil.getOTPAlgorithmSpec(algorithm).length / 4,
      );
    },
  );
  //check otp is different from previous one
  it(
    "(" +
      OTPAlgorithm[algorithm] +
      ") " +
      "current otp = '" +
      otp +
      "', previous otp = '" +
      previousOtp +
      "', verifying otp codes are different",
    () => {
      expect(otp).to.not.eq(previousOtp);
    },
  );
  //check otp generated is valid
  const _secret = "B1B0AE0E5ADFBF89A5F7DF440592A3AE"; //measuring 'secret'
  const _date = new Date("2021-01-01T00:00:00.000Z"); //measuring 'date'
  const _counter = calculateCounter(_date);
  const _otp = await KeyUtilities.generate(
    OTPType.hotp,
    _secret,
    _counter,
    30,
    6,
    algorithm,
  );
  let _validOtp = "";
  if (algorithm === OTPAlgorithm.GOST3411_2012_256) {
    _validOtp = "982313"; //measuring 'otp'
  }
  if (algorithm === OTPAlgorithm.GOST3411_2012_512) {
    _validOtp = "733980"; //measuring 'otp'
  }
  it(
    "(" +
      OTPAlgorithm[algorithm] +
      ") " +
      "valid otp for secret '" +
      _secret +
      "' and date '" +
      _date +
      "' is '" +
      _validOtp +
      "', verifying",
    () => {
      expect(_otp).to.eq(_validOtp);
    },
  );
}

function getOtp(signature: string) {
  const digits: number = 6;
  const offset = hex2dec(signature.substring(signature.length - 1));
  let otp =
    (hex2dec(signature.substr(offset * 2, 8)) & hex2dec("7fffffff")) + "";
  otp = otp.substr(otp.length - digits, digits);
  return otp;
}

function counterToArray(counter: number) {
  const data = [];
  let value = counter;
  for (let i = 8; i-- > 0; value >>>= 8) {
    data[i] = value & 0xff;
  }
  return data;
}

function getRandomHEXString(length: number) {
  const randomChars = "ABCDEF0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length),
    );
  }
  return result;
}

function hex2dec(s: string) {
  return Number(`0x${s}`);
}

function parseHexString(str: string) {
  const result = [];
  while (str.length >= 8) {
    result.push(parseInt(str.substring(0, 8), 16));
    str = str.substring(8, str.length);
  }
  return result;
}

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}
