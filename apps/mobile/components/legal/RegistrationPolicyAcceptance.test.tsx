import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import { Button, ControlField, Dialog, Label } from "heroui-native";
import { IconAlertTriangle } from "@tabler/icons-react-native";
import { useRegistrationAcceptance } from "@/hooks/auth/useRegistrationAcceptance";
import { finishRegistrationPolicyReading, measureRegistrationPolicy, readAndCloseRegistrationPolicy } from "@/tests/support/registrationPolicy";
import RegistrationPolicyAcceptance from "./RegistrationPolicyAcceptance";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("@tabler/icons-react-native", () => ({ IconAlertTriangle: jest.fn(() => null), IconInfoCircle: jest.fn(() => null) }));

function Form({ isDisabled = false, privacyVersion }: { isDisabled?: boolean; privacyVersion?: string }) {
  const policies = useRegistrationAcceptance();
  const form = privacyVersion ? { ...policies, value: { ...policies.value, privacyVersion } } : policies;
  return <>
    <RegistrationPolicyAcceptance form={form} isDisabled={isDisabled} />
    <Button isDisabled={isDisabled || !policies.canSubmit}><Button.Label>Submit</Button.Label></Button>
  </>;
}

const checkbox = (label: string) => screen.getByRole("checkbox", { name: `I have read and agree to the ${label}` });
const overlay = () => screen.UNSAFE_getAllByType(Dialog.Overlay).find((node) => node.props.isCloseOnPress !== undefined);

it("requires independent reading then explicit checkboxes, and starts fresh on a new visit", () => {
  const { unmount } = render(<Form />);
  expect(checkbox("Privacy Policy")).toBeDisabled();
  expect(checkbox("Terms and Conditions")).toBeDisabled();
  fireEvent.press(checkbox("Privacy Policy"));
  expect(checkbox("Privacy Policy")).not.toBeChecked();
  readAndCloseRegistrationPolicy("Privacy Policy");
  expect(checkbox("Privacy Policy")).toBeEnabled();
  expect(checkbox("Privacy Policy")).not.toBeChecked();
  expect(checkbox("Terms and Conditions")).toBeDisabled();
  fireEvent.press(checkbox("Privacy Policy"));
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  readAndCloseRegistrationPolicy("Terms and Conditions");
  fireEvent.press(checkbox("Terms and Conditions"));
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  expect(screen.queryByText("Open each policy and scroll to the end to enable its checkbox.")).toBeNull();
  unmount(); render(<Form />);
  expect(checkbox("Privacy Policy")).toBeDisabled();
  expect(checkbox("Terms and Conditions")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

it("opens separate fixed-document dialogs without a policy switch", () => {
  render(<Form />);
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.getByRole("header", { name: "13. Changes to this Privacy Policy" })).toBeTruthy();
  expect(screen.queryByRole("header", { name: "22. Compliance with Philippine Rental Laws" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Terms" })).toBeNull();
  finishRegistrationPolicyReading();
  fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
  fireEvent.press(screen.getByRole("button", { name: "Read Terms and Conditions" }));
  expect(screen.getByRole("header", { name: "22. Compliance with Philippine Rental Laws" })).toBeTruthy();
  expect(screen.queryByRole("header", { name: "13. Changes to this Privacy Policy" })).toBeNull();
});

it("guards Close, backdrop and cached Android Back callbacks until the current document reaches the end", () => {
  render(<Form />);
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  const cachedBack = screen.UNSAFE_getByType(Dialog).props.onOpenChange;
  measureRegistrationPolicy();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeDisabled();
  expect(overlay()?.props.isCloseOnPress).toBe(false);
  fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
  act(() => cachedBack(false));
  expect(screen.getByLabelText("Privacy Policy document")).toBeTruthy();
  finishRegistrationPolicyReading();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
  expect(overlay()?.props.isCloseOnPress).toBe(true);
  act(() => cachedBack(false));
  expect(screen.queryByLabelText("Privacy Policy document")).toBeNull();
  expect(checkbox("Privacy Policy")).not.toBeChecked();
  fireEvent.press(screen.getByRole("button", { name: "Read Terms and Conditions" }));
  act(() => cachedBack(false));
  expect(screen.getByLabelText("Terms and Conditions document")).toBeTruthy();
});

it("allows dismissal while layout is pending, and a reviewed reopening needs no second scroll", () => {
  render(<Form />);
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
  fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
  expect(checkbox("Privacy Policy")).toBeDisabled();
  readAndCloseRegistrationPolicy("Privacy Policy");
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  measureRegistrationPolicy();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
});

it("shows a single compact colored warning on early attempts without accepting", () => {
  render(<Form />);
  expect(screen.getAllByText("Open each policy and scroll to the end to enable its checkbox.")).toHaveLength(1);
  fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Privacy Policy" }));
  expect(screen.getByText("Please open the Privacy Policy and scroll to the end before accepting it.")).toBeTruthy();
  expect(jest.mocked(IconAlertTriangle).mock.calls.at(-1)?.[0].color).toBe("#92400E");
  fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Terms and Conditions" }));
  expect(screen.queryByText("Please open the Privacy Policy and scroll to the end before accepting it.")).toBeNull();
  expect(screen.getByText("Please open the Terms and Conditions and scroll to the end before accepting it.")).toBeTruthy();
  expect(checkbox("Terms and Conditions")).not.toBeChecked();
  expect(screen.queryByRole("button", { name: "Review policy" })).toBeNull();
  readAndCloseRegistrationPolicy("Terms and Conditions");
  expect(screen.queryByText("Please open the Terms and Conditions and scroll to the end before accepting it.")).toBeNull();
});

it("does not react to attempts or policy links while submitting", () => {
  render(<Form isDisabled />);
  fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Privacy Policy" }));
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.queryByText("Please open the Privacy Policy and scroll to the end before accepting it.")).toBeNull();
  expect(screen.queryByLabelText("Privacy Policy document")).toBeNull();
});

it("does not carry completion to a different policy revision", () => {
  const { rerender } = render(<Form />);
  readAndCloseRegistrationPolicy("Privacy Policy");
  expect(checkbox("Privacy Policy")).toBeEnabled();
  rerender(<Form privacyVersion="another-version" />);
  expect(checkbox("Privacy Policy")).toBeDisabled();
});

it("uses the readable warning icon color in dark mode without coloring the message", () => {
  const theme = jest.requireMock("uniwind").useUniwind;
  theme.mockReturnValue({ theme: "dark", hasAdaptiveThemes: true });
  try {
    render(<Form />);
    fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Privacy Policy" }));
    expect(jest.mocked(IconAlertTriangle).mock.calls.at(-1)?.[0].color).toBe("#FDE047");
    expect(screen.getByText("Please open the Privacy Policy and scroll to the end before accepting it.").props.className).toContain("text-foreground");
  } finally {
    theme.mockReturnValue({ theme: "light", hasAdaptiveThemes: true });
  }
});

it("preserves required markers, bounded native scrolling and no competing swipe gesture", () => {
  render(<Form />);
  expect(screen.getByText("Privacy Policy*")).toBeTruthy();
  expect(screen.getByText("Terms and Conditions*")).toBeTruthy();
  screen.UNSAFE_getAllByType(Label).filter((label) => label.props.isRequired !== undefined)
    .forEach((label) => expect(label.props.isRequired).toBe(false));
  screen.UNSAFE_getAllByType(ControlField).forEach((field) => expect(field.props.isRequired).toBe(true));
  fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  const content = screen.UNSAFE_getAllByType(Dialog.Content).find((node) => node.props.isSwipeable === false);
  expect(content).toBeDefined();
  expect(content?.props.style.height).toBeGreaterThan(0);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(scroll.props.style).toEqual({ flex: 1, minHeight: 0 });
  expect(scroll.props.nestedScrollEnabled).toBe(true);
  expect(scroll.props.showsVerticalScrollIndicator).toBe(true);
  expect(scroll.findAllByType(Button)).toHaveLength(0);
});
