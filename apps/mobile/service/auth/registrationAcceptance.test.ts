import {
  emptyRegistrationAcceptance, requireRegistrationAcceptance, validateRegistrationAcceptance,
  POLICY_UPDATE_MESSAGE,
} from "./registrationAcceptance";

it("starts both policies unchecked with the displayed revisions", () => {
  expect(emptyRegistrationAcceptance()).toEqual({
    termsAccepted: false, privacyAccepted: false, termsVersion: "1.1", privacyVersion: "1.0",
  });
});

it.each([undefined, null, {}, { termsAccepted: "true", privacyAccepted: "true" }])("rejects missing or malformed acceptance: %p", (value) => {
  expect(() => requireRegistrationAcceptance(value)).toThrow();
});

it("requires separate selections and refuses stale revisions", () => {
  const accepted = { ...emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true };
  expect(validateRegistrationAcceptance(accepted)).toEqual({});
  expect(validateRegistrationAcceptance({ ...accepted, privacyAccepted: false }).privacyAccepted).toBeTruthy();
  expect(validateRegistrationAcceptance({ ...accepted, termsVersion: "old" }).version).toBe(POLICY_UPDATE_MESSAGE);
});
