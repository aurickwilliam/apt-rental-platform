import { fireEvent, render, screen } from "@testing-library/react-native";

import ApplicationDecisionBar from "./ApplicationDecisionBar";

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { danger: "#EF4444" } }),
}));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  function Button({
    children,
    onPress,
    isDisabled,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    isDisabled?: boolean;
  }) {
    return React.createElement(
      Pressable,
      { onPress, accessibilityRole: "button", accessibilityState: { disabled: !!isDisabled } },
      children,
    );
  }
  Button.Label = function Label({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  return { Button };
});

const handlers = () => ({ onReject: jest.fn(), onApprove: jest.fn() });

it("calls the matching handler for Reject and Approve", () => {
  const { onReject, onApprove } = handlers();
  render(<ApplicationDecisionBar isUnitOccupied={false} isLoading={false} onReject={onReject} onApprove={onApprove} />);

  fireEvent.press(screen.getByText("Reject"));
  fireEvent.press(screen.getByText("Approve"));
  expect(onReject).toHaveBeenCalledTimes(1);
  expect(onApprove).toHaveBeenCalledTimes(1);
});

const isDisabled = (label: string) =>
  !!screen.getByRole("button", { name: label }).props.accessibilityState?.disabled;

it("disables approval and explains why when the unit is occupied", () => {
  const { onReject, onApprove } = handlers();
  render(<ApplicationDecisionBar isUnitOccupied isLoading={false} onReject={onReject} onApprove={onApprove} />);

  expect(screen.getByText(/already occupied/)).toBeTruthy();
  expect(isDisabled("Approve")).toBe(true);
  expect(isDisabled("Reject")).toBe(false);
});

it("disables both actions while a decision is in flight", () => {
  const { onReject, onApprove } = handlers();
  render(<ApplicationDecisionBar isUnitOccupied={false} isLoading onReject={onReject} onApprove={onApprove} />);

  expect(isDisabled("Approve")).toBe(true);
  expect(isDisabled("Reject")).toBe(true);
});
