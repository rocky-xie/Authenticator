import "mocha";
import { expect } from "chai";
import { parseOTPAuthURI } from "../models/otpauth-uri";

describe("OTPAuth URI validation", () => {
  it("parses Microsoft-compatible TOTP settings", () => {
    const result = parseOTPAuthURI(
      "otpauth://totp/Microsoft:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Microsoft&algorithm=SHA1&digits=6&period=30",
    );

    expect(result).to.deep.equal({
      account: "user@example.com",
      algorithm: "SHA1",
      counter: 0,
      digits: 6,
      issuer: "Microsoft",
      period: 30,
      secret: "JBSWY3DPEHPK3PXP",
      type: "totp",
    });
  });

  it("preserves colons in account labels and HOTP counters", () => {
    const result = parseOTPAuthURI(
      "otpauth://hotp/Issuer:team:user?secret=JBSWY3DPEHPK3PXP&counter=42",
    );

    expect(result?.account).to.equal("team:user");
    expect(result?.counter).to.equal(42);
  });

  it("rejects unsupported types and oversized secrets", () => {
    expect(
      parseOTPAuthURI("otpauth://unknown/test?secret=JBSWY3DPEHPK3PXP"),
    ).to.equal(null);
    expect(
      parseOTPAuthURI(`otpauth://totp/test?secret=${"A".repeat(2049)}`),
    ).to.equal(null);
  });
});
