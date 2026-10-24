import { fireEvent, render, screen } from "@testing-library/react-native";

import MonthCollectionCard from "@/app/(tabs)/components/dashboard/MonthCollectionCard";
import CashToConfirmCard from "./CashToConfirmCard";
import LandlordPaymentsSummary from "./LandlordPaymentsSummary";

jest.mock("@/service/dashboard/dashboardService", () => ({
  collectionProgress: ({ collected, expected }: { collected: number; expected: number }) => ({
    collected,
    expected,
    percent: expected > 0 ? Math.round((collected / expected) * 100) : 0,
  }),
}));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#6B7280" }, isDark: false }) }));

const summary = {
  collected: 90000,
  paidCount: 2,
  awaitingCount: 1,
  awaitingAmount: 45000,
  declinedCount: 2,
  lastPaid: { date: "2026-09-24", amount: 45000 },
};

describe("LandlordPaymentsSummary", () => {
  it("shows the four figures with their captions", () => {
    render(<LandlordPaymentsSummary summary={summary} scopeLabel="All years" />);
    expect(screen.getByText("Collected")).toBeTruthy();
    expect(screen.getByText(/All years · 2 paid payments/)).toBeTruthy();
    expect(screen.getByText("1 payment waiting")).toBeTruthy();
    expect(screen.getByText("Paid Sep 24, 2026")).toBeTruthy();
    expect(screen.getByText("Rejected, failed or unpaid")).toBeTruthy();
  });

  it("paints every tile title in the brand color", () => {
    render(<LandlordPaymentsSummary summary={summary} scopeLabel="All years" />);
    for (const title of ["Collected", "Cash to confirm", "Last payment", "Declined or failed"]) {
      expect(screen.getByText(title).props.className).toContain("text-primary");
    }
  });

  it("is calm when nothing is waiting or declined, and has no last payment", () => {
    render(
      <LandlordPaymentsSummary
        summary={{ ...summary, collected: 0, paidCount: 0, awaitingCount: 0, awaitingAmount: 0, declinedCount: 0, lastPaid: null }}
        scopeLabel="2026"
      />,
    );
    expect(screen.getByText("Nothing waiting")).toBeTruthy();
    expect(screen.getByText("All clear")).toBeTruthy();
    expect(screen.getByText("No paid payments yet")).toBeTruthy();
    expect(screen.getByText(/2026 · 0 paid payments/)).toBeTruthy();
  });

  it("makes Cash to confirm tappable only while cash is waiting", () => {
    const onPress = jest.fn();
    const waiting = render(<LandlordPaymentsSummary summary={summary} scopeLabel="All years" onPressCashToConfirm={onPress} />);
    fireEvent.press(screen.getByLabelText(/^Cash to confirm/));
    expect(onPress).toHaveBeenCalledTimes(1);
    waiting.unmount();

    const none = jest.fn();
    render(<LandlordPaymentsSummary summary={{ ...summary, awaitingCount: 0, awaitingAmount: 0 }} scopeLabel="All years" onPressCashToConfirm={none} />);
    expect(screen.queryByLabelText(/^Cash to confirm/)).toBeNull();
    expect(none).not.toHaveBeenCalled();
  });
});

describe("CashToConfirmCard", () => {
  it("names the count and total, and opens the waiting payments", () => {
    const onPress = jest.fn();
    render(<CashToConfirmCard count={3} amount={30000} onPress={onPress} />);
    expect(screen.getByText("Needs attention")).toBeTruthy();
    expect(screen.getByText(/3 cash payments to confirm/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(/Needs attention: 3 cash payments to confirm/));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses the singular for one payment", () => {
    render(<CashToConfirmCard count={1} amount={5000} onPress={jest.fn()} />);
    expect(screen.getByText(/1 cash payment to confirm/)).toBeTruthy();
  });
});

describe("Dashboard Collected this month card", () => {
  const thisMonth = { collected: 20000, expected: 40000, pending: 0, outstanding: 20000 };

  it("stays informational without an entry point", () => {
    render(<MonthCollectionCard thisMonth={thisMonth} />);
    expect(screen.queryByText("View all payments")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens every payment when given an entry point", () => {
    const onPress = jest.fn();
    render(<MonthCollectionCard thisMonth={thisMonth} onPressViewPayments={onPress} />);
    expect(screen.getByText("View all payments")).toBeTruthy();
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
