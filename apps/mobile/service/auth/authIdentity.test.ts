import { hasEmailPasswordIdentity } from "./authIdentity";

describe("hasEmailPasswordIdentity", () => {
  it("recognises email, Google-only and linked accounts", () => {
    expect(hasEmailPasswordIdentity({ identities: [{ provider: "email" }] })).toBe(true);
    expect(hasEmailPasswordIdentity({ identities: [{ provider: "google" }] })).toBe(false);
    expect(
      hasEmailPasswordIdentity({ identities: [{ provider: "google" }, { provider: "email" }] }),
    ).toBe(true);
  });

  it("falls back to app_metadata providers", () => {
    expect(hasEmailPasswordIdentity({ identities: null, app_metadata: { providers: ["email"] } })).toBe(true);
    expect(hasEmailPasswordIdentity({ app_metadata: { providers: ["google"] } })).toBe(false);
    expect(hasEmailPasswordIdentity({})).toBe(false);
  });
});
