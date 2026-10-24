import { getPasswordRequirements, meetsPasswordPolicy } from "@repo/constants";

describe("password policy", () => {
  it("accepts a password with every rule met", () => {
    expect(meetsPasswordPolicy("Passw0rd!")).toBe(true);
    expect(meetsPasswordPolicy("Passw0rd_ok")).toBe(true);
  });

  it.each([
    ["too short", "Pa5!"],
    ["no uppercase", "passw0rd!"],
    ["no lowercase", "PASSW0RD!"],
    ["no number", "Password!"],
    ["no special character", "Passw0rdd"],
    ["only whitespace as special", "Passw0rd "],
  ])("rejects %s", (_label, password) => {
    expect(meetsPasswordPolicy(password)).toBe(false);
  });

  it("reports the confirmation match separately", () => {
    expect(getPasswordRequirements("Passw0rd!", "other").passwordsMatch).toBe(false);
    expect(getPasswordRequirements("Passw0rd!", "Passw0rd!").passwordsMatch).toBe(true);
    expect(getPasswordRequirements("", "").passwordsMatch).toBe(false);
  });
});
