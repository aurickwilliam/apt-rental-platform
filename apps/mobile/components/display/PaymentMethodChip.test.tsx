import { render, screen } from "@testing-library/react-native";

import { PAYMENT_METHOD_COLORS } from "@repo/constants";
import PaymentMethodChip from "./PaymentMethodChip";

let mockIsDark = false;
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { gray100: "#F3F4F6", gray500: "#6B7280" }, isDark: mockIsDark }),
}));
jest.mock("@/service/payments/paymentService", () => ({
  methodLabel: (method: string | null) => ({ gcash: "GCash", maya: "Maya", qrph: "QRPh", card: "Debit/Credit Card", cash: "Cash" })[method ?? ""] ?? method ?? "—",
}));
jest.mock("@tabler/icons-react-native", () => {
  const { Text } = jest.requireActual("react-native");
  const icon = (name: string) => {
    const Icon = ({ color }: { color?: string }) => <Text accessibilityLabel={`icon ${name} ${color}`}>{name}</Text>;
    Icon.displayName = `Icon${name}`;
    return Icon;
  };
  return {
    IconCash: icon("cash"), IconCreditCard: icon("card"), IconDeviceMobile: icon("gcash"), IconQrcode: icon("qrph"), IconWallet: icon("maya"),
  };
});
jest.mock("heroui-native", () => {
  const { Text, View } = jest.requireActual("react-native");
  const Label = ({ children, style }: { children?: React.ReactNode; style?: object }) => <Text style={style}>{children}</Text>;
  const Chip = Object.assign(
    ({ children, style }: { children?: React.ReactNode; style?: object }) => <View testID="chip" style={style}>{children}</View>,
    { Label },
  );
  return { Chip };
});

const styleOf = () => {
  const style = screen.getByTestId("chip").props.style;
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
};

beforeEach(() => { mockIsDark = false; });

describe("PaymentMethodChip", () => {
  it.each([
    ["gcash", "GCash", "gcash"],
    ["maya", "Maya", "maya"],
    ["qrph", "QRPh", "qrph"],
    ["card", "Debit/Credit Card", "card"],
    ["Debit/Credit-Card", "Debit/Credit-Card", "card"],
    ["cash", "Cash", "cash"],
  ] as const)("draws %s with its own color, icon and label", (method, label, key) => {
    render(<PaymentMethodChip method={method} />);
    const palette = PAYMENT_METHOD_COLORS[key].light;
    expect(styleOf()).toMatchObject({ backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, borderWidth: 1 });
    expect(screen.getByText(label).props.style).toMatchObject({ color: palette.textColor });
    expect(screen.getByLabelText(new RegExp(`^icon ${key} ${palette.textColor}$`))).toBeTruthy();
  });

  it("gives every method a different background", () => {
    const backgrounds = (["gcash", "maya", "qrph", "card", "cash"] as const).map((key) => PAYMENT_METHOD_COLORS[key].light.backgroundColor);
    expect(new Set(backgrounds).size).toBe(5);
  });

  it("uses the dark palette in dark mode", () => {
    mockIsDark = true;
    render(<PaymentMethodChip method="gcash" />);
    expect(styleOf()).toMatchObject({ backgroundColor: PAYMENT_METHOD_COLORS.gcash.dark.backgroundColor });
    expect(screen.getByText("GCash").props.style).toMatchObject({ color: PAYMENT_METHOD_COLORS.gcash.dark.textColor });
  });

  it("keeps a plain gray chip, with no icon, for a method it does not know", () => {
    render(<PaymentMethodChip method="bank-transfer" />);
    expect(styleOf()).toEqual({ backgroundColor: "#F3F4F6" });
    expect(screen.getByText("bank-transfer").props.style).toMatchObject({ color: "#6B7280" });
    expect(screen.queryByLabelText(/^icon /)).toBeNull();
  });
});
