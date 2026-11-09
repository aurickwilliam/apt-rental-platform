import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import MoveInCostFooterSection from "./MoveInCostFooterSection";

jest.mock("heroui-native", () => jest.requireActual("../../../../../tests/support/heroUINativeStub"));
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { SafeAreaView: ({ children }: { children: ReactNode }) => <View>{children}</View> };
});
jest.mock("@/components/display/AppDialog", () => ({ __esModule: true, default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => (isOpen ? children : null) }));
jest.mock("@/components/display/MoveInCostBreakdown", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: () => <Text>breakdown-total</Text> };
});
jest.mock("@/components/display/AcceptedPaymentMethods", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ methods }: { methods: string[] }) => <Text>{`methods:${methods.join(",")}`}</Text> };
});

const props = { monthlyRent: 15000, securityDeposit: 30000, advanceRent: 15000, onApplyNow: jest.fn() };

it("shows the accepted payment methods in the move-in cost modal, below the total", () => {
  render(<MoveInCostFooterSection {...props} acceptedMethods={["GCash", "Cash"]} />);
  expect(screen.queryByText("methods:GCash,Cash")).toBeNull(); // not on the page, only in the modal
  fireEvent.press(screen.getByText("Move-in cost breakdown"));
  const texts = screen.getAllByText(/breakdown-total|methods:/).map((node) => node.props.children);
  expect(texts).toEqual(["breakdown-total", "methods:GCash,Cash"]);
});

it("leaves the modal as it was while the methods are unknown", () => {
  render(<MoveInCostFooterSection {...props} acceptedMethods={null} />);
  fireEvent.press(screen.getByText("Move-in cost breakdown"));
  expect(screen.getByText("breakdown-total")).toBeTruthy();
  expect(screen.queryByText(/methods:/)).toBeNull();
});
