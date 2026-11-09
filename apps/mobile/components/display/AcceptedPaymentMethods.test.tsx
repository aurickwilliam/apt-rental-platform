import { render, screen } from "@testing-library/react-native";
import AcceptedPaymentMethods from "./AcceptedPaymentMethods";

jest.mock("@/components/display/PaymentMethodChip", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ method }: { method: string }) => <Text>{`chip:${method}`}</Text> };
});

it("lists the methods the landlord accepts with a note that the landlord set them", () => {
  render(<AcceptedPaymentMethods methods={["GCash", "Cash"]} />);
  expect(screen.getByText("Accepted payment methods")).toBeTruthy();
  expect(screen.getByText("chip:GCash")).toBeTruthy();
  expect(screen.getByText("chip:Cash")).toBeTruthy();
  expect(screen.queryByText("chip:Maya")).toBeNull();
  expect(screen.getByText("Set by the landlord. You choose one when you pay your rent. Have a preferred method? Message the landlord first to agree on it.")).toBeTruthy();
});

it("shows nothing while the methods are unknown or unavailable", () => {
  const { rerender } = render(<AcceptedPaymentMethods methods={undefined} />);
  expect(screen.queryByText("Accepted payment methods")).toBeNull();
  rerender(<AcceptedPaymentMethods methods={null} />);
  expect(screen.queryByText("Accepted payment methods")).toBeNull();
  rerender(<AcceptedPaymentMethods methods={[]} />);
  expect(screen.queryByText("Accepted payment methods")).toBeNull();
  expect(screen.queryByText(/Set by the landlord/)).toBeNull();
});
