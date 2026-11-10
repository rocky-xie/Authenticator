import { UserSettings } from "../models/settings";
import { expect } from "chai";

describe("clock offset", () => {
  afterEach(() => {
    UserSettings.items = {};
  });

  it("uses a recently synchronized offset", () => {
    const now = 2_000_000_000_000;
    UserSettings.items = { offset: 42, offsetUpdatedAt: now - 1000 };
    expect(UserSettings.getClockOffset(now)).to.equal(42);
  });

  it("ignores a legacy offset without an update timestamp", () => {
    UserSettings.items = { offset: 42 };
    expect(UserSettings.getClockOffset()).to.equal(0);
  });

  it("ignores an expired offset", () => {
    const now = 2_000_000_000_000;
    UserSettings.items = {
      offset: 42,
      offsetUpdatedAt: now - 24 * 60 * 60 * 1000 - 1,
    };
    expect(UserSettings.getClockOffset(now)).to.equal(0);
  });
});
