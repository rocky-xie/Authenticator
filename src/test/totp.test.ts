import "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import { KeyUtilities } from "../models/key-utilities";
import { OTPAlgorithm, OTPType } from "../models/otp";

describe("Microsoft 365 OATH TOTP compatibility", () => {
  // Base32 encoding of the RFC 6238 SHA-1 test secret
  // "12345678901234567890". Microsoft software OATH tokens use the same
  // standard TOTP parameters: a shared Base32 secret and a 30-second step.
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  it("generates the RFC 6238 SHA-1 code used by software OATH tokens", () => {
    sinon.useFakeTimers(59_000);

    const code = KeyUtilities.generate(
      OTPType.totp,
      secret,
      0,
      30,
      8,
      OTPAlgorithm.SHA1,
    );

    expect(code).to.equal("94287082");
  });

  it("keeps the current code until the full 30-second period ends", () => {
    sinon.useFakeTimers(59_999);

    const code = KeyUtilities.generate(
      OTPType.totp,
      secret,
      0,
      30,
      6,
      OTPAlgorithm.SHA1,
    );

    expect(code).to.equal("287082");
  });
});
