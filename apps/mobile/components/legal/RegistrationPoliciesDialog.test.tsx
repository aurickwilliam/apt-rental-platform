import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { TERMS_POLICY } from "@/constants/legal/terms";
import RegistrationPoliciesDialog from "./RegistrationPoliciesDialog";
import * as policyContent from "./LegalPolicyContent";
import { measureRegistrationPolicy } from "@/tests/support/registrationPolicy";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));

it("gives the registration scroll its own gesture root, uninterrupted swipes and final scroll samples", () => {
  render(<RegistrationPoliciesDialog policy="terms" reviewed={false} onRead={jest.fn()} onClose={jest.fn()} />);
  const root = screen.UNSAFE_getByType(GestureHandlerRootView);
  const scroll = root.findByType(ScrollView);
  expect(scroll.props.disallowInterruption).toBe(true);
  expect(scroll.props.shouldActivateOnStart).toBe(true);
  expect(scroll.props.removeClippedSubviews).toBe(false);
  expect(scroll.props.scrollEventThrottle).toBe(16);
  expect(scroll.props.onScrollEndDrag).toBe(scroll.props.onScroll);
  expect(scroll.props.onMomentumScrollEnd).toBe(scroll.props.onScroll);
  const policyText = screen.UNSAFE_getAllByType(Text).filter((node) => node.props.selectable !== undefined);
  expect(policyText.length).toBeGreaterThan(20);
  policyText.forEach((node) => expect(node.props.selectable).toBe(false));
});

it("keeps shared legal content selectable by default outside registration", () => {
  render(<policyContent.default policy={TERMS_POLICY} />);
  const policyText = screen.UNSAFE_getAllByType(Text).filter((node) => node.props.selectable !== undefined);
  expect(policyText.length).toBeGreaterThan(20);
  policyText.forEach((node) => expect(node.props.selectable).toBe(true));
});

it("recognizes the first Terms bottom arrival when the final layout follows the last scroll sample", () => {
  const onRead = jest.fn();
  render(<RegistrationPoliciesDialog policy="terms" reviewed={false} onRead={onRead} onClose={jest.fn()} />);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  fireEvent(scroll, "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 400 } } });
  fireEvent.scroll(scroll, { nativeEvent: {
    contentOffset: { x: 0, y: 800 }, contentSize: { width: 300, height: 1200 },
    layoutMeasurement: { width: 300, height: 400 },
  } });
  expect(onRead).not.toHaveBeenCalled();
  fireEvent(scroll, "contentSizeChange", 300, 1216);
  fireEvent(screen.getByTestId("registration-policy-end"), "layout", {
    nativeEvent: { layout: { x: 0, y: 1199, width: 300, height: 1 } },
  });
  expect(onRead).toHaveBeenCalledTimes(1);
  expect(onRead).toHaveBeenCalledWith("terms");
});

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
