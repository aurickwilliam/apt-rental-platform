import { describeRunningBuild } from "./otaUpdateService";

describe("describeRunningBuild", () => {
  it("says nothing where updates are disabled", () => {
    expect(describeRunningBuild({ isEnabled: false, isEmbeddedLaunch: true, updateId: null, channel: null })).toBeNull();
  });

  it("names the built-in code of a fresh install", () => {
    expect(describeRunningBuild({ isEnabled: true, isEmbeddedLaunch: true, updateId: "0000", channel: "production" })).toBe(
      "Built-in code · production",
    );
  });

  it("shows a short update id once an over-the-air update is running", () => {
    expect(
      describeRunningBuild({
        isEnabled: true,
        isEmbeddedLaunch: false,
        updateId: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        channel: "production",
      }),
    ).toBe("Update 1a2b3c4d · production");
  });

  it("falls back to built-in code when there is no update id", () => {
    expect(describeRunningBuild({ isEnabled: true, isEmbeddedLaunch: false, updateId: null, channel: null })).toBe("Built-in code");
  });
});
