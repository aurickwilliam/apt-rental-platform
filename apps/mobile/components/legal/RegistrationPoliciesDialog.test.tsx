import { fireEvent, render, screen } from "@testing-library/react-native";
import { findAllInTree } from "../../tests/support/testTraversal";
import { TERMS_POLICY } from "@/constants/legal/terms";
import RegistrationPoliciesDialog from "./RegistrationPoliciesDialog";
import * as policyContent from "./LegalPolicyContent";
import { measureRegistrationPolicy } from "@/tests/support/registrationPolicy";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));

// Gesture-only props never reach the host tree (RNTL v14 renders host elements only),
// so record what the reader passes to the gesture ScrollView and whether it sits
// inside a GestureHandlerRootView.
const mockGestureScrolls: { props: Record<string, unknown>; insideRoot: boolean }[] = [];
jest.mock("react-native-gesture-handler", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const actual = jest.requireActual<typeof import("react-native-gesture-handler")>("react-native-gesture-handler");
  const RootContext = React.createContext(false);
  const GestureHandlerRootView = (props: React.ComponentProps<typeof actual.GestureHandlerRootView>) =>
    React.createElement(RootContext.Provider, { value: true }, React.createElement(actual.GestureHandlerRootView, props));
  const ScrollView = React.forwardRef<unknown, Record<string, unknown>>(function RecordingScrollView(props, ref) {
    const insideRoot = React.useContext(RootContext);
    mockGestureScrolls.push({ props, insideRoot });
    return React.createElement(actual.ScrollView as React.ComponentType<any>, { ...props, ref });
  });
  return { ...actual, GestureHandlerRootView, ScrollView };
});

const latestGestureScroll = () => mockGestureScrolls[mockGestureScrolls.length - 1];

it("gives the registration scroll its own gesture root, uninterrupted swipes and final scroll samples", async () => {
  await render(<RegistrationPoliciesDialog policy="terms" reviewed={false} onRead={jest.fn()} onClose={jest.fn()} />);
  const { props: scroll, insideRoot } = latestGestureScroll();
  expect(insideRoot).toBe(true);
  expect(scroll.disallowInterruption).toBe(true);
  expect(scroll.shouldActivateOnStart).toBe(true);
  expect(scroll.removeClippedSubviews).toBe(false);
  expect(scroll.scrollEventThrottle).toBe(16);
  expect(scroll.onScrollEndDrag).toBe(scroll.onScroll);
  expect(scroll.onMomentumScrollEnd).toBe(scroll.onScroll);
  const policyText = findAllInTree(screen.root!, (node) => String(node.type) === "Text" && node.props.selectable !== undefined);
  expect(policyText.length).toBeGreaterThan(20);
  policyText.forEach((node) => expect(node.props.selectable).toBe(false));
});

it("keeps shared legal content selectable by default outside registration", async () => {
  await render(<policyContent.default policy={TERMS_POLICY} />);
  const policyText = findAllInTree(screen.root!, (node) => String(node.type) === "Text" && node.props.selectable !== undefined);
  expect(policyText.length).toBeGreaterThan(20);
  policyText.forEach((node) => expect(node.props.selectable).toBe(true));
});

it("recognizes the first Terms bottom arrival when the final layout follows the last scroll sample", async () => {
  const onRead = jest.fn();
  await render(<RegistrationPoliciesDialog policy="terms" reviewed={false} onRead={onRead} onClose={jest.fn()} />);
  const scroll = screen.getByLabelText(/ document$/);
  await fireEvent(scroll, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 400 } } });
  await fireEvent.scroll(scroll, { nativeEvent: {
    contentOffset: { x: 0, y: 800 }, contentSize: { width: 300, height: 1200 },
    layoutMeasurement: { width: 300, height: 400 },
  } });
  expect(onRead).not.toHaveBeenCalled();
  await fireEvent(scroll, "contentSizeChange", 300, 1216);
  await fireEvent(screen.getByTestId("registration-policy-end"), "layout", {
    nativeEvent: { layout: { x: 0, y: 1199, width: 300, height: 1 } },
  });
  expect(onRead).toHaveBeenCalledTimes(1);
  expect(onRead).toHaveBeenCalledWith("terms");
});

it("allows closing after a policy render fails without accepting or changing the form", async () => {
  const onRead = jest.fn();
  const onClose = jest.fn();
  const props = { policy: "privacy" as const, reviewed: false, onRead, onClose };
  const { rerender } = await render(<RegistrationPoliciesDialog {...props} />);
  await measureRegistrationPolicy();
  expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeDisabled();
  const errors = jest.spyOn(console, "error").mockImplementation(() => {});
  const content = jest.spyOn(policyContent, "default").mockImplementation(() => { throw new Error("Unavailable policy"); });
  try {
    await rerender(<RegistrationPoliciesDialog {...props} />);
    expect(screen.getByText(/We could not display this policy/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close Privacy Policy" })).toBeEnabled();
    expect(onRead).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Close Privacy Policy" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalledWith("Could not display registration policy", { name: "Error" });
  } finally {
    errors.mockRestore(); content.mockRestore();
  }
});
