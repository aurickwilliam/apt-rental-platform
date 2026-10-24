import { fireEvent, render, screen } from "@testing-library/react-native";

import LandlordPaymentReceipt from "@/app/landlord/manage-apartment/[apartmentId]/payment-history/[paymentId]";

const mockBack = jest.fn();
const mockInvalidate = jest.fn();
const mockSave = jest.fn();
const mockReceiptRef = { current: null };

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ apartmentId: "unit-a", paymentId: "pay-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }) }));
const mockSetQueryData = jest.fn();
jest.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate, setQueryData: mockSetQueryData }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconChevronLeft: () => null }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("heroui-native", () => {
  const { Pressable, Text: T } = jest.requireActual("react-native");
  const Button = Object.assign(
    ({ children, onPress, accessibilityLabel }: { children?: React.ReactNode; onPress?: () => void; accessibilityLabel?: string }) => <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>{children}</Pressable>,
    { Label: ({ children }: { children?: React.ReactNode }) => <T>{children}</T> },
  );
  return { Button, Spinner: () => <T>spinner</T> };
});

type Query = { data?: Record<string, unknown>; isLoading: boolean; error: unknown; refetch: jest.Mock };
let mockQuery: Query;
jest.mock("@/hooks/payments", () => ({
  usePayment: () => mockQuery,
  getPaymentQueryKey: (id: string) => ["payment", id],
}));

const mockConfirm = { mutate: jest.fn(), reset: jest.fn(), isPending: false, error: null as unknown };
const mockDecline = { mutate: jest.fn(), reset: jest.fn(), isPending: false, error: null as unknown };
jest.mock("@/hooks/landlord", () => ({
  useLandlordPaymentConfirmation: () => mockConfirm,
  useLandlordPaymentDecline: () => mockDecline,
  useSaveReceiptPhoto: () => ({ receiptRef: mockReceiptRef, save: mockSave }),
}));

jest.mock("@/components/landlord-payments/PaymentReceipt", () => {
  const { Text, View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ payment, footer }: { payment: { id: string }; footer: React.ReactNode }) => (
      <View><Text>{`receipt ${payment.id}${footer ? " with actions" : " plain"}`}</Text>{footer}</View>
    ),
  };
});
jest.mock("@/components/landlord-payments/PaymentReceiptActions", () => {
  const { Text, View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ isBusy, error, onConfirm, onDecline, onClearError, onSavePhoto }: { isBusy: boolean; error: string | null; onConfirm: () => void; onDecline: () => void; onClearError: () => void; onSavePhoto: () => void }) => (
      <View>
        <Text>{`busy=${String(isBusy)} error=${error ?? "none"}`}</Text>
        <Text accessibilityLabel="actions confirm" onPress={onConfirm}>confirm</Text>
        <Text accessibilityLabel="actions decline" onPress={onDecline}>decline</Text>
        <Text accessibilityLabel="actions clear" onPress={onClearError}>clear</Text>
        <Text accessibilityLabel="actions save" onPress={onSavePhoto}>save</Text>
      </View>
    ),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = { data: { id: "pay-1" }, isLoading: false, error: null, refetch: jest.fn() };
  Object.assign(mockConfirm, { isPending: false, error: null });
  Object.assign(mockDecline, { isPending: false, error: null });
});

describe("landlord payment receipt screen", () => {
  it("is the web's receipt on the app's blue, not a transparent modal", () => {
    render(<LandlordPaymentReceipt />);
    expect(screen.getByText("receipt pay-1 with actions")).toBeTruthy();
    const root = screen.UNSAFE_root.findAll((node) => String(node.props.className ?? "").includes("bg-primary"));
    expect(root.length).toBeGreaterThan(0);
  });

  it("keeps an off-screen copy of the receipt without its buttons for the photo", () => {
    render(<LandlordPaymentReceipt />);
    // The copy is hidden from screen readers on purpose, so the query must include hidden elements.
    expect(screen.getByText("receipt pay-1 plain", { includeHiddenElements: true })).toBeTruthy();
    const capture = screen.UNSAFE_root.findAll((node) => node.props.collapsable === false && node.props.pointerEvents === "none")[0];
    expect(capture.props.style).toMatchObject({ position: "absolute", left: -10000, backgroundColor: "#376BF5" });
    expect(capture.props.importantForAccessibility).toBe("no-hide-descendants");
  });

  it("saves the photo through the hook", () => {
    render(<LandlordPaymentReceipt />);
    fireEvent.press(screen.getByLabelText("actions save"));
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("goes back from the chevron", () => {
    render(<LandlordPaymentReceipt />);
    fireEvent.press(screen.getByLabelText("Back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("confirms and declines the payment through their own mutations, then refreshes the receipt", () => {
    render(<LandlordPaymentReceipt />);
    fireEvent.press(screen.getByLabelText("actions confirm"));
    expect(mockConfirm.mutate).toHaveBeenCalledTimes(1);
    expect(mockConfirm.mutate.mock.calls[0][0]).toBe("pay-1");
    mockConfirm.mutate.mock.calls[0][1].onSuccess();
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["payment", "pay-1"] });
    // The cached payment flips at once, so the buttons go before the refetch lands.
    const [key, update] = mockSetQueryData.mock.calls[0];
    expect(key).toEqual(["payment", "pay-1"]);
    expect(update({ id: "pay-1", status: "pending" })).toEqual({ id: "pay-1", status: "paid" });

    fireEvent.press(screen.getByLabelText("actions decline"));
    expect(mockDecline.mutate.mock.calls[0][0]).toBe("pay-1");
    mockDecline.mutate.mock.calls[0][1].onSuccess();
    expect(mockSetQueryData.mock.calls[1][1]({ status: "pending" })).toEqual({ status: "rejected" });
    expect(mockConfirm.mutate).toHaveBeenCalledTimes(1);
  });

  it("reports busy and the failed write's message, and starting over clears both mutations", () => {
    mockConfirm.isPending = true;
    mockDecline.error = new Error("Could not update payment status.");
    render(<LandlordPaymentReceipt />);
    expect(screen.getByText("busy=true error=Could not update payment status.")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("actions clear"));
    expect(mockConfirm.reset).toHaveBeenCalled();
    expect(mockDecline.reset).toHaveBeenCalled();
  });

  it("shows a spinner while loading, with no receipt", () => {
    mockQuery = { isLoading: true, error: null, refetch: jest.fn() };
    render(<LandlordPaymentReceipt />);
    expect(screen.getByText("spinner")).toBeTruthy();
    expect(screen.queryByText(/^receipt /)).toBeNull();
  });

  it("offers Try Again for a load error and Go Back when the payment is gone", () => {
    mockQuery = { isLoading: false, error: new Error("down"), refetch: jest.fn() };
    const failed = render(<LandlordPaymentReceipt />);
    fireEvent.press(screen.getByText("Try Again"));
    expect(mockQuery.refetch).toHaveBeenCalled();
    failed.unmount();

    mockQuery = { isLoading: false, error: null, refetch: jest.fn() };
    render(<LandlordPaymentReceipt />);
    expect(screen.getByText("We could not find this payment.")).toBeTruthy();
    fireEvent.press(screen.getByText("Go Back"));
    expect(mockBack).toHaveBeenCalled();
  });
});
