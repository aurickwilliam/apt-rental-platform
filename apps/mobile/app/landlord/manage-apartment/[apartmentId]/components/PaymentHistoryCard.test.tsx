import { fireEvent, render, screen } from "@testing-library/react-native";

import PaymentHistoryCard from "./PaymentHistoryCard";

jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: {}, isDark: false }) }));
jest.mock("@/hooks/useStatusChipStyles", () => ({
  statusChipSurface: () => ({}),
  useStatusChipStyles: () => ({ success: { textColor: "#166534" }, warning: { textColor: "#92400E" }, danger: { textColor: "#991B1B" } }),
}));
jest.mock("@/service/payments/paymentService", () => ({
  formatReferenceId: (reference: string | null) => reference ?? "—",
}));
jest.mock("@/components/display/PaymentMethodChip", () => {
  const { Text } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ method }: { method: string }) => <Text>{`method chip ${method}`}</Text> };
});
jest.mock("heroui-native", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  const Card = Object.assign(Passthrough, { Header: Passthrough, Body: Passthrough, Footer: Passthrough });
  const Chip = Object.assign(Passthrough, { Label: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text> });
  const PressableFeedback = Object.assign(
    ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => <Pressable accessibilityRole="button" onPress={onPress}>{children}</Pressable>,
    { Highlight: () => null },
  );
  return { Card, Chip, PressableFeedback };
});

const base = { month: "March 2026", amount: 65000, status: "paid", method: "cash", referenceId: "APT-L44ZOUGS", onPress: jest.fn() };

describe("PaymentHistoryCard", () => {
  it("puts only the amount in the middle, large, and no paid date anywhere", () => {
    render(<PaymentHistoryCard {...base} unitName="San Jose Corner Suite 2BR" tenantName="MAHARTT Navales" />);
    const amount = screen.getByText(/65,000/);
    expect(amount.props.className).toContain("text-2xl");
    expect(screen.queryByText(/Paid on|Recorded on/)).toBeNull();
    expect(screen.getByText("March 2026")).toBeTruthy();
    expect(screen.getByText("method chip cash")).toBeTruthy();
  });

  it("shares the bottom row between the unit and tenant on the left and the reference on the right", () => {
    render(<PaymentHistoryCard {...base} unitName="San Jose Corner Suite 2BR" tenantName="MAHARTT Navales" />);
    expect(screen.getByText("San Jose Corner Suite 2BR")).toBeTruthy();
    expect(screen.getByText("MAHARTT Navales")).toBeTruthy();
    expect(screen.getByText("APT-L44ZOUGS")).toBeTruthy();
    // Unit and tenant sit in the footer with the reference, not under the amount.
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf("65,000")).toBeLessThan(json.indexOf("San Jose Corner Suite 2BR"));
    expect(json.indexOf("MAHARTT Navales")).toBeLessThan(json.indexOf("APT-L44ZOUGS"));
  });

  it("shows just the reference when a unit's own history gives no unit or tenant, and still opens on press", () => {
    const onPress = jest.fn();
    render(<PaymentHistoryCard {...base} onPress={onPress} />);
    expect(screen.getByText("APT-L44ZOUGS")).toBeTruthy();
    expect(screen.queryByText("MAHARTT Navales")).toBeNull();
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows when a payment was recorded on a unit's own history, which names no unit or tenant", () => {
    render(<PaymentHistoryCard {...base} paidDate="3/5/2026" />);
    expect(screen.getByText("Paid on: 3/5/2026")).toBeTruthy();
    render(<PaymentHistoryCard {...base} status="pending" paidDate="3/6/2026" />);
    expect(screen.getByText("Recorded on: 3/6/2026")).toBeTruthy();
  });

  it("words a declined payment like its receipt instead of Unpaid", () => {
    render(<PaymentHistoryCard {...base} status="rejected" />);
    expect(screen.getByText("Rejected")).toBeTruthy();
    expect(screen.queryByText("Unpaid")).toBeNull();
  });
});
