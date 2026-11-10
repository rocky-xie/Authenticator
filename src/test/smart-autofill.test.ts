import { expect } from "chai";
import {
  getMatchedEntries,
  getSiteNameFromUrl,
  isMicrosoftIdentityHost,
} from "../utils";

function entry(issuer: string) {
  return { issuer } as OTPEntryInterface;
}

describe("smart autofill site matching", () => {
  it("recognizes Microsoft global and China identity hosts", () => {
    expect(isMicrosoftIdentityHost("login.microsoftonline.com")).to.equal(true);
    expect(isMicrosoftIdentityHost("login.chinacloudapi.cn")).to.equal(true);
    expect(
      isMicrosoftIdentityHost("login.partner.microsoftonline.cn"),
    ).to.equal(true);
    expect(isMicrosoftIdentityHost("example.com")).to.equal(false);
  });

  it("matches Microsoft issuers on the shared China login endpoint", () => {
    const site = getSiteNameFromUrl(
      "登录",
      "https://login.chinacloudapi.cn/common/oauth2/authorize",
    );
    expect(
      getMatchedEntries(site, [entry("Microsoft:alice@example.cn")]),
    ).to.have.length(1);
  });

  it("does not treat unrelated issuers as Microsoft", () => {
    const site = getSiteNameFromUrl(
      "Sign in",
      "https://login.microsoftonline.com/common/oauth2/authorize",
    );
    expect(getMatchedEntries(site, [entry("Example Bank")])).to.have.length(0);
  });
});
