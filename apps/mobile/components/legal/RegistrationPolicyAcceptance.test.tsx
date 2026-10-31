import { fireEvent, render, screen } from "@testing-library/react-native";
import { Button } from "heroui-native";
import { useRegistrationAcceptance } from "@/hooks/auth/useRegistrationAcceptance";
import RegistrationPolicyAcceptance from "./RegistrationPolicyAcceptance";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));

function Form() {
  const policies = useRegistrationAcceptance();
  return <>
    <RegistrationPolicyAcceptance form={policies} />
    <Button isDisabled={!policies.canSubmit}><Button.Label>Submit</Button.Label></Button>
  </>;
}

it("requires both independent checkboxes and starts fresh on a new visit", () => {
  const { unmount } = render(<Form />);
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  fireEvent.press(screen.getByRole("checkbox", { name: "I have read and agree to the Privacy Policy" }));
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  fireEvent.press(screen.getByRole("checkbox", { name: "I have read and agree to the Terms and Conditions" }));
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  unmount();
  render(<Form />);
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

it("reads, switches and closes policies without accepting or submitting", () => {
  render(<Form />);
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.getByText("Last updated: January 15, 2026")).toBeTruthy();
  expect(screen.getByRole("header", { name: "13. Changes to this Privacy Policy" })).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Terms" }));
  expect(screen.getByText("Last updated: October 29, 2026")).toBeTruthy();
  expect(screen.getByRole("header", { name: "22. Compliance with Philippine Rental Laws" })).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Close policies" }));
  expect(screen.queryByText("Last updated: October 29, 2026")).toBeNull();
  expect(screen.getByRole("checkbox", { name: "I have read and agree to the Privacy Policy" })).not.toBeChecked();
  expect(screen.getByRole("checkbox", { name: "I have read and agree to the Terms and Conditions" })).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});
