import { fireEvent, render, screen } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import { Button, ControlField, Dialog, Label } from "heroui-native";
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

it("places the required marker after each complete policy name, not after the introductory label", () => {
  render(<Form />);
  expect(screen.getByText("Privacy Policy*")).toBeTruthy();
  expect(screen.getByText("Terms and Conditions*")).toBeTruthy();
  const introductoryLabels = screen.UNSAFE_getAllByType(Label).filter((label) => label.props.isRequired !== undefined);
  expect(introductoryLabels).toHaveLength(2);
  introductoryLabels.forEach((label) => expect(label.props.isRequired).toBe(false));
  screen.UNSAFE_getAllByType(ControlField).forEach((field) => expect(field.props.isRequired).toBe(true));
});

it("reserves a bounded scrolling body without a competing dialog swipe gesture", () => {
  render(<Form />);
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  const content = screen.UNSAFE_getAllByType(Dialog.Content).find((node) => node.props.isSwipeable === false);
  expect(content).toBeDefined();
  expect(content?.props.style.height).toBeGreaterThan(0);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(scroll.props.style).toEqual({ flex: 1, minHeight: 0 });
  expect(scroll.props.nestedScrollEnabled).toBe(true);
  expect(scroll.props.showsVerticalScrollIndicator).toBe(true);
  expect(scroll.findAllByType(Button)).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Close policies" })).toBeTruthy();
});
