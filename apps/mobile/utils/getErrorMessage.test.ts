import { getErrorMessage } from "./getErrorMessage";

const FALLBACK = "Could not remove this property.";

describe("getErrorMessage", () => {
  it("returns the message of an Error", () => {
    expect(getErrorMessage(new Error("boom"), FALLBACK)).toBe("boom");
  });

  it("returns the message of a Supabase-style error object", () => {
    const databaseError = { code: "23514", message: "End the active tenancy before deleting this property." };
    expect(getErrorMessage(databaseError, FALLBACK)).toBe("End the active tenancy before deleting this property.");
  });

  it("falls back when there is no usable message", () => {
    expect(getErrorMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage("plain string", FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage({}, FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage({ message: "   " }, FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage({ message: 42 }, FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage(new Error(""), FALLBACK)).toBe(FALLBACK);
  });
});
