import { fireEvent, render, screen } from "@testing-library/react-native";
import RegistrationPoliciesDialog from "./RegistrationPoliciesDialog";
import * as policyContent from "./LegalPolicyContent";
import { measureRegistrationPolicy } from "@/tests/support/registrationPolicy";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));

it("allows closing after a policy render fails without accepting or changing the form", () => {
  const onRead = jest.fn();
  const onClose = jest.fn();
  const props = { policy: "privacy" as const, reviewed: false, onRead, onClose };
  const { rerender } = render(<RegistrationPoliciesDialog {...props} />);
  measureRegistrationPolicy();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeDisabled();
  const errors = jest.spyOn(console, "error").mockImplementation(() => {});
  const content = jest.spyOn(policyContent, "default").mockImplementation(() => { throw new Error("Unavailable policy"); });
  try {
    rerender(<RegistrationPoliciesDialog {...props} />);
    expect(screen.getByText(/We could not display this policy/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
    expect(onRead).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalledWith("Could not display registration policy", { name: "Error" });
  } finally {
    errors.mockRestore(); content.mockRestore();
  }
});
