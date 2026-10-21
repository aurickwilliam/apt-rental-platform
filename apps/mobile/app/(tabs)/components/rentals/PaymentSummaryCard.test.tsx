import { fireEvent, render, screen } from "@testing-library/react-native";
import { formatPesoDisplay, type TenancyBill } from "@repo/utils";
import PaymentSummaryCard from "./PaymentSummaryCard";

jest.mock("heroui-native", () => jest.requireActual("../../../../tests/support/heroUINativeStub"));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ isDark: false }),
}));

const MOVE_IN_BILL: TenancyBill = {
  kind: "move_in",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-31",
  dueDate: "2026-10-21",
  monthlyRent: 15000,
  rentDue: 15000,
  securityDeposit: 15000,
  advanceRent: 15000,
  advancePeriodStart: "2026-11-01",
  advancePeriodEnd: "2026-11-30",
  fees: [],
  totalDue: 45000,
  rentPaid: false,
  coveredByAdvance: false,
  pendingPayment: null,
};

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

it("shows only the move-in total, keeping the due date and actions", () => {
  const pay = jest.fn();
  const history = jest.fn();
  render(<PaymentSummaryCard bill={MOVE_IN_BILL} totalRent={15000} periodMonth="October" periodYear="2026" dueDate="Oct 21, 2026" onPayNowPress={pay} onViewHistoryPress={history} />);

  expect(screen.getByText("Move-in payment")).toBeTruthy();
  expect(screen.getByText(formatPesoDisplay(45000))).toBeTruthy();
  expect(screen.getByText("October 2026 · Due Oct 21, 2026")).toBeTruthy();
  expect(screen.getByText("Pending")).toBeTruthy();
  expect(screen.queryByText("Monthly rent")).toBeNull();
  expect(screen.queryByText(formatPesoDisplay(15000))).toBeNull();
  expect(screen.queryByText(/security deposit/i)).toBeNull();
  expect(screen.queryByText(/advance rent/i)).toBeNull();
  fireEvent.press(screen.getByText("Pay Now"));
  fireEvent.press(screen.getByLabelText("View payment history"));
  expect(pay).toHaveBeenCalledTimes(1);
  expect(history).toHaveBeenCalledTimes(1);
});

it("uses the server move-in total including fees without adding breakdown rows", () => {
  render(<PaymentSummaryCard bill={{ ...MOVE_IN_BILL, fees: [{ id: "fee-1", title: "Repair fee", amount: 2000 }], totalDue: 47000 }} totalRent={15000} />);

  expect(screen.getByText(formatPesoDisplay(47000))).toBeTruthy();
  expect(screen.queryByText("Repair fee")).toBeNull();
  expect(screen.queryByText(formatPesoDisplay(45000))).toBeNull();
});

it("preserves the monthly amount after the move-in bill is settled", () => {
  render(<PaymentSummaryCard bill={{ ...MOVE_IN_BILL, kind: "fees", rentDue: 0, securityDeposit: 0, advanceRent: 0, totalDue: 0, rentPaid: true }} status="Paid" totalRent={15000} />);

  expect(screen.getByText("Monthly rent")).toBeTruthy();
  expect(screen.getByText(formatPesoDisplay(15000))).toBeTruthy();
  expect(screen.getByText("Paid")).toBeTruthy();
  expect(screen.queryByText("Move-in payment")).toBeNull();
  expect(screen.queryByText("Pay Now")).toBeNull();
});
