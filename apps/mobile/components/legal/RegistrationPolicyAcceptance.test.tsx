import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { Button } from "heroui-native";
import { findAllInTree } from "../../tests/support/testTraversal";
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
const stubbed = (prop: string) => findAllInTree(screen.root!, (node) => node.props[prop] !== undefined);
const overlay = () => stubbed("stubIsCloseOnPress")[0];

it("requires independent reading then explicit checkboxes, and starts fresh on a new visit", async () => {
  const { unmount } = await render(<Form />);
  expect(checkbox("Privacy Policy")).toBeDisabled();
  expect(checkbox("Terms and Conditions")).toBeDisabled();
  await fireEvent.press(checkbox("Privacy Policy"));
  expect(checkbox("Privacy Policy")).not.toBeChecked();
  await readAndCloseRegistrationPolicy("Privacy Policy");
  expect(checkbox("Privacy Policy")).toBeEnabled();
  expect(checkbox("Privacy Policy")).not.toBeChecked();
  expect(checkbox("Terms and Conditions")).toBeDisabled();
  await fireEvent.press(checkbox("Privacy Policy"));
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  await readAndCloseRegistrationPolicy("Terms and Conditions");
  await fireEvent.press(checkbox("Terms and Conditions"));
  expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  expect(screen.queryByText("Open each policy and scroll to the end to enable its checkbox.")).toBeNull();
  await unmount(); await render(<Form />);
  expect(checkbox("Privacy Policy")).toBeDisabled();
  expect(checkbox("Terms and Conditions")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
});

it("opens separate fixed-document dialogs without a policy switch", async () => {
  await render(<Form />);
  await fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.getByRole("header", { name: "13. Changes to this Privacy Policy" })).toBeTruthy();
  expect(screen.queryByRole("header", { name: "22. Compliance with Philippine Rental Laws" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Terms" })).toBeNull();
  await finishRegistrationPolicyReading();
  await fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
  await fireEvent.press(screen.getByRole("button", { name: "Read Terms and Conditions" }));
  expect(screen.getByRole("header", { name: "22. Compliance with Philippine Rental Laws" })).toBeTruthy();
  expect(screen.queryByRole("header", { name: "13. Changes to this Privacy Policy" })).toBeNull();
});

it("guards Close, backdrop and cached Android Back callbacks until the current document reaches the end", async () => {
  await render(<Form />);
  await fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  const cachedBack = stubbed("stubOnOpenChange")[0].props.stubOnOpenChange;
  await measureRegistrationPolicy();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeDisabled();
  expect(overlay()?.props.stubIsCloseOnPress).toBe(false);
  await fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
  await act(() => cachedBack(false));
  expect(screen.getByLabelText("Privacy Policy document")).toBeTruthy();
  await finishRegistrationPolicyReading();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
  expect(overlay()?.props.stubIsCloseOnPress).toBe(true);
  await act(() => cachedBack(false));
  expect(screen.queryByLabelText("Privacy Policy document")).toBeNull();
  expect(checkbox("Privacy Policy")).not.toBeChecked();
  await fireEvent.press(screen.getByRole("button", { name: "Read Terms and Conditions" }));
  await act(() => cachedBack(false));
  expect(screen.getByLabelText("Terms and Conditions document")).toBeTruthy();
});

it("allows dismissal while layout is pending, and a reviewed reopening needs no second scroll", async () => {
  await render(<Form />);
  await fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
  expect(checkbox("Privacy Policy")).toBeDisabled();
  await readAndCloseRegistrationPolicy("Privacy Policy");
  await fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  await measureRegistrationPolicy();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
});

it("shows a single compact colored warning on early attempts without accepting", async () => {
  await render(<Form />);
  expect(screen.getAllByText("Open each policy and scroll to the end to enable its checkbox.")).toHaveLength(1);
  await fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Privacy Policy" }));
  expect(screen.getByText("Please open the Privacy Policy and scroll to the end before accepting it.")).toBeTruthy();
  expect(jest.mocked(IconAlertTriangle).mock.calls.at(-1)?.[0].color).toBe("#92400E");
  await fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Terms and Conditions" }));
  expect(screen.queryByText("Please open the Privacy Policy and scroll to the end before accepting it.")).toBeNull();
  expect(screen.getByText("Please open the Terms and Conditions and scroll to the end before accepting it.")).toBeTruthy();
  expect(checkbox("Terms and Conditions")).not.toBeChecked();
  expect(screen.queryByRole("button", { name: "Review policy" })).toBeNull();
  await readAndCloseRegistrationPolicy("Terms and Conditions");
  expect(screen.queryByText("Please open the Terms and Conditions and scroll to the end before accepting it.")).toBeNull();
});

it("does not react to attempts or policy links while submitting", async () => {
  await render(<Form isDisabled />);
  await fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Privacy Policy" }));
  await fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  expect(screen.queryByText("Please open the Privacy Policy and scroll to the end before accepting it.")).toBeNull();
  expect(screen.queryByLabelText("Privacy Policy document")).toBeNull();
});

it("does not carry completion to a different policy revision", async () => {
  const { rerender } = await render(<Form />);
  await readAndCloseRegistrationPolicy("Privacy Policy");
  expect(checkbox("Privacy Policy")).toBeEnabled();
  await rerender(<Form privacyVersion="another-version" />);
  expect(checkbox("Privacy Policy")).toBeDisabled();
});

it("uses the readable warning icon color in dark mode without coloring the message", async () => {
  const theme = jest.requireMock("uniwind").useUniwind;
  theme.mockReturnValue({ theme: "dark", hasAdaptiveThemes: true });
  try {
    await render(<Form />);
    await fireEvent.press(screen.getByRole("button", { name: "Review required before accepting the Privacy Policy" }));
    expect(jest.mocked(IconAlertTriangle).mock.calls.at(-1)?.[0].color).toBe("#FDE047");
    expect(screen.getByText("Please open the Privacy Policy and scroll to the end before accepting it.").props.className).toContain("text-foreground");
  } finally {
    theme.mockReturnValue({ theme: "light", hasAdaptiveThemes: true });
  }
});

it("preserves required markers, bounded native scrolling and no competing swipe gesture", async () => {
  await render(<Form />);
  expect(screen.getByText("Privacy Policy*")).toBeTruthy();
  expect(screen.getByText("Terms and Conditions*")).toBeTruthy();
  const requiredFlags = stubbed("stubIsRequired");
  expect(requiredFlags.length).toBeGreaterThan(0);
  requiredFlags.filter((node) => String(node.type) === "Text")
    .forEach((label) => expect(label.props.stubIsRequired).toBe(false));
  requiredFlags.filter((node) => node.props.accessibilityRole === "checkbox")
    .forEach((field) => expect(field.props.stubIsRequired).toBe(true));
  await fireEvent.press(screen.getByRole("button", { name: "Read Privacy Policy" }));
  const content = stubbed("stubIsSwipeable").find((node) => node.props.stubIsSwipeable === false);
  expect(content).toBeDefined();
  expect(content?.props.stubStyle.height).toBeGreaterThan(0);
  const scroll = screen.getByLabelText(/ document$/);
  expect(scroll.props.style).toEqual({ flex: 1, minHeight: 0 });
  expect(scroll.props.nestedScrollEnabled).toBe(true);
  expect(scroll.props.showsVerticalScrollIndicator).toBe(true);
  expect(within(scroll).queryAllByRole("button")).toHaveLength(0);
});
