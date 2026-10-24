import { act, fireEvent, render, screen } from "@testing-library/react-native";

import PaymentReceipt from "./PaymentReceipt";

const mockSetString = jest.fn();
const mockZigzag: { props?: Record<string, unknown> } = {};

jest.mock("react-native-svg", () => {
  const { View } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>, Line: (props: Record<string, unknown>) => <View testID="divider" accessibilityLabel={String(props.strokeDasharray)} /> };
});
jest.mock("expo-clipboard", () => ({ setStringAsync: (...args: unknown[]) => mockSetString(...args) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" }, isDark: false }) }));
jest.mock("@/hooks/useStatusChipStyles", () => ({
  useStatusChipStyles: () => ({
    success: { backgroundColor: "#DCFCE7", textColor: "#166534", borderColor: "#86EFAC" },
    warning: { backgroundColor: "#FEF3C7", textColor: "#92400E", borderColor: "#FCD34D" },
    danger: { backgroundColor: "#FEE2E2", textColor: "#991B1B", borderColor: "#FCA5A5" },
  }),
  statusChipSurface: (style: { backgroundColor: string }) => ({ backgroundColor: style.backgroundColor }),
}));
jest.mock("@/components/display/PaymentMethodChip", () => {
  const { Text } = jest.requireActual("react-native");
  return { __esModule: true, default: ({ method }: { method: string }) => <Text>{`method chip ${method}`}</Text> };
});
jest.mock("@/app/tenant/payment/components/ZigzagEdge", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => { mockZigzag.props = props; return null; },
}));
jest.mock("@/service/payments/paymentService", () => ({
  formatReferenceId: (reference: string | null) => reference ?? "—",
}));
jest.mock("heroui-native", () => {
  const { Text, View } = jest.requireActual("react-native");
  const Chip = Object.assign(
    ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    { Label: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text> },
  );
  return { Chip };
});
jest.mock("@tabler/icons-react-native", () => {
  const { Text } = jest.requireActual("react-native");
  const icon = (name: string) => {
    const Icon = () => <Text>{`icon:${name}`}</Text>;
    Icon.displayName = `Icon${name}`;
    return Icon;
  };
  return {
    IconAlertCircle: icon("alert"), IconCheck: icon("check"), IconCircleCheck: icon("paid"),
    IconCircleX: icon("x"), IconClockHour4: icon("clock"), IconCopy: icon("copy"),
  };
});

const payment = (change: Record<string, unknown> = {}) => ({
  id: "pay-1", created_at: "2026-03-05T02:00:00Z", date: "2026-03-05", amount: 65000, status: "paid", method: "cash",
  reference_id: "APT-L44ZOUGS", period_start: "2026-03-01", period_end: "2026-03-31", due_date: "2026-03-05",
  apartment_name: "San Jose Corner Suite 2BR", landlord_name: null, tenant_name: "MAHARTT Navales", billing_kind: null, ...change,
});

beforeEach(() => { mockSetString.mockReset(); mockSetString.mockResolvedValue(undefined); });

describe("PaymentReceipt", () => {
  it("shows a received payment the way the web does", () => {
    render(<PaymentReceipt payment={payment() as never} footer={null} />);
    for (const text of ["Payment received", "March 2026", "Tenant", "MAHARTT Navales", "Apartment", "San Jose Corner Suite 2BR", "Paid on", "Method", "Status", "Reference No.", "APT-L44ZOUGS", "method chip cash"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.getByText(/65,000/)).toBeTruthy();
    expect(screen.getByText("Paid")).toBeTruthy();
    expect(screen.getByText("icon:paid")).toBeTruthy();
    expect(screen.queryByText("Total")).toBeNull();
  });

  it("words a pending, declined and failed payment for the landlord", () => {
    const pending = render(<PaymentReceipt payment={payment({ status: "pending" }) as never} footer={null} />);
    expect(screen.getByText("Payment pending")).toBeTruthy();
    expect(screen.getByText("Recorded on")).toBeTruthy();
    expect(screen.getByText("icon:clock")).toBeTruthy();
    pending.unmount();

    const declined = render(<PaymentReceipt payment={payment({ status: "rejected" }) as never} footer={null} />);
    expect(screen.getByText("Payment declined")).toBeTruthy();
    expect(screen.getByText("Rejected")).toBeTruthy();
    declined.unmount();

    render(<PaymentReceipt payment={payment({ status: "failed" }) as never} footer={null} />);
    expect(screen.getByText("Payment failed")).toBeTruthy();
  });

  it("lists a move-in breakdown with its total, and shows dashes for a missing tenant or unit", () => {
    render(
      <PaymentReceipt
        payment={payment({
          billing_kind: "move_in", amount: 18000, tenant_name: null, apartment_name: null,
          rent_amount: 6000, deposit_amount: 12000, advance_amount: 0, maintenance_amount: 0,
        }) as never}
        footer={null}
      />,
    );
    expect(screen.getByText("Move-in payment")).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("renders the footer inside the paper and a transparent torn edge below it", () => {
    render(<PaymentReceipt payment={payment() as never} footer={<></>} />);
    expect(mockZigzag.props).toMatchObject({ hanging: true, cutColor: "#FFFFFF" });
  });

  it("separates the sections with dashed lines", () => {
    render(<PaymentReceipt payment={payment() as never} footer={null} />);
    // Dividers measure themselves, so report a width to each.
    for (const view of screen.UNSAFE_root.findAll((node) => typeof node.props.onLayout === "function")) {
      fireEvent(view, "layout", { nativeEvent: { layout: { width: 200, height: 1 } } });
    }
    const dividers = screen.getAllByTestId("divider");
    expect(dividers.length).toBeGreaterThanOrEqual(2);
    expect(dividers.every((divider) => divider.props.accessibilityLabel === "4 4")).toBe(true);
  });

  it("keeps the method and status values on the right", () => {
    render(<PaymentReceipt payment={payment() as never} footer={null} />);
    const rightAligned = (label: string) => {
      let node = screen.getByText(label).parent;
      while (node && !String(node.props?.className ?? "").includes("justify-end")) node = node.parent;
      return Boolean(node);
    };
    expect(rightAligned("method chip cash")).toBe(true);
    expect(rightAligned("Paid")).toBe(true);
  });

  it("copies the reference and confirms it", async () => {
    render(<PaymentReceipt payment={payment() as never} footer={null} />);
    await act(async () => { fireEvent.press(screen.getByLabelText("Copy reference")); });
    expect(mockSetString).toHaveBeenCalledWith("APT-L44ZOUGS");
    expect(screen.getByLabelText("Reference copied")).toBeTruthy();
  });

  it("does not claim a copy that the clipboard refused", async () => {
    mockSetString.mockRejectedValue(new Error("denied"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    render(<PaymentReceipt payment={payment() as never} footer={null} />);
    await act(async () => { fireEvent.press(screen.getByLabelText("Copy reference")); });
    expect(screen.queryByLabelText("Reference copied")).toBeNull();
    expect(screen.getByLabelText("Copy reference")).toBeTruthy();
  });
});
