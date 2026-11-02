import { getBankAvailability } from "@repo/constants";
import {
  ACCEPTED_METHODS_REQUIRED_MESSAGE,
  acceptedMethodsToRow,
  isMethodAccepted,
  normalizeAcceptedMethods,
  toggleAcceptedMethod,
  validateAcceptedMethods,
} from "./acceptedPaymentMethods";
import { PAYMENT_METHOD_TYPES } from "./paymentMethods";

it("allows every method when no setting is saved", () => {
  expect(normalizeAcceptedMethods(null)).toEqual([...PAYMENT_METHOD_TYPES]);
  expect(normalizeAcceptedMethods([])).toEqual([...PAYMENT_METHOD_TYPES]);
  expect(normalizeAcceptedMethods(["unknown"])).toEqual([...PAYMENT_METHOD_TYPES]);
});

it("reads and writes database names in the app's method order", () => {
  expect(normalizeAcceptedMethods(["cash", "gcash", "gcash", "nope"])).toEqual(["GCash", "Cash"]);
  expect(acceptedMethodsToRow(["Cash", "Bank Transfer", "GCash"])).toEqual(["gcash", "bank_transfer", "cash"]);
});

it("refuses an empty list and toggles a method without touching the input", () => {
  expect(validateAcceptedMethods([])).toBe(ACCEPTED_METHODS_REQUIRED_MESSAGE);
  expect(validateAcceptedMethods(["Cash"])).toBeNull();
  const accepted = ["GCash", "Cash"] as const;
  expect(toggleAcceptedMethod(accepted, "Maya")).toEqual(["GCash", "Maya", "Cash"]);
  expect(toggleAcceptedMethod(accepted, "GCash")).toEqual(["Cash"]);
  expect(accepted).toEqual(["GCash", "Cash"]);
});

it("says whether a method is allowed", () => {
  expect(isMethodAccepted(["Cash"], "GCash")).toBe(false);
  expect(isMethodAccepted(["Maya", "Cash"], "Cash")).toBe(true);
  expect(isMethodAccepted([], "Cash")).toBe(false);
});

it("disables a bank over its limit with the reason, and never hides it", () => {
  const [bpi, unionBank] = getBankAvailability(80_000);
  expect(bpi).toMatchObject({ available: false, reason: "BPI allows up to ₱50,000 per payment." });
  expect(unionBank).toMatchObject({ available: true, reason: null });
  expect(getBankAvailability(50_000).every((entry) => entry.available)).toBe(true);
});
