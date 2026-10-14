import { fireEvent, render, screen } from "@testing-library/react-native";
import { formatPesoDisplay } from "@repo/utils";
import PaymentSummaryCard from "./PaymentSummaryCard";

jest.mock("heroui-native", () => jest.requireActual("../../../../tests/support/heroUINativeStub"));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ isDark: false }),
}));

it("shows the amount, month and readable due date with working actions", () => {
  const pay = jest.fn();
  const history = jest.fn();
  render(<PaymentSummaryCard periodMonth="December" periodYear="2026" totalRent={80000} dueDate="Dec 5, 2026" onPayNowPress={pay} onViewHistoryPress={history} />);

  expect(screen.getByText("Monthly rent")).toBeTruthy();
  expect(screen.getByText(formatPesoDisplay(80000))).toBeTruthy();
  expect(screen.getByText("December 2026 · Due Dec 5, 2026")).toBeTruthy();
  expect(screen.getByText("Pending")).toBeTruthy();
  fireEvent.press(screen.getByText("Pay Now"));
  fireEvent.press(screen.getByLabelText("View payment history"));
  expect(pay).toHaveBeenCalledTimes(1);
  expect(history).toHaveBeenCalledTimes(1);
});

it("keeps rent details and history when paid, without a pay button", () => {
  render(<PaymentSummaryCard status="Paid" totalRent={80000} periodMonth="December" periodYear="2026" />);
  expect(screen.getByText("Paid")).toBeTruthy();
  expect(screen.getByText(formatPesoDisplay(80000))).toBeTruthy();
  expect(screen.getByText("December 2026")).toBeTruthy();
  expect(screen.queryByText("Pay Now")).toBeNull();
  expect(screen.getByLabelText("View payment history")).toBeTruthy();
  expect(screen.queryByText(/^Due /)).toBeNull();
});
