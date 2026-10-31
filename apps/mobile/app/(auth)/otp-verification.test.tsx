import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import OTPVerification from "./otp-verification";
import { useRegistrationStore } from "@/stores/useRegistrationStore";
import { emptyRegistrationAcceptance, POLICY_UPDATE_MESSAGE } from "@/service/auth/registrationAcceptance";

const mockParams: Record<string, string> = { email: "a@example.test" };
const mockVerifyOtp = jest.fn();
const mockResend = jest.fn();
const mockSignOut = jest.fn();
const mockRpc = jest.fn();
const mockReplace = jest.fn();
const mockSwitchTo = jest.fn();
const mockMissing = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace, dismissAll: jest.fn(), back: jest.fn() }),
}));
jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("hooks/auth", () => ({ useCountdown: () => ({ countdown: 0, reset: jest.fn() }) }));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { textPrimary: "#333" } }) }));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockScreen({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock("@/components/display/ErrorDialog", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockError({ message, isOpen }: { message: string; isOpen: boolean }) { return isOpen ? <Text>{message}</Text> : null; };
});
jest.mock("@repo/supabase", () => ({ supabase: {
  auth: {
    verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    resend: (...args: unknown[]) => mockResend(...args),
    signOut: () => mockSignOut(),
  },
  rpc: (...args: unknown[]) => mockRpc(...args),
} }));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: { getState: () => ({ switchTo: (...args: unknown[]) => mockSwitchTo(...args) }) } }));
jest.mock("@/utils/queryClient", () => ({ clearQueryClient: jest.fn() }));
jest.mock("@/service/auth/profileMissingService", () => ({
  isProfileMissing: () => mockMissing(),
  profileMissingRoute: () => "/finish-profile",
}));

const acceptance = { ...emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true };
const profileDetails = {
  first_name: "Ana", last_name: "Lim", middle_name: null, suffix: null, gender: "Female", birth_date: "1990-01-05",
  mobile_number: "09171234567", province: "Metro Manila", city: "Caloocan", barangay: "Barangay 1", postal_code: 1400, street_address: "1 Main St",
};

async function verify() {
  fireEvent.changeText(screen.getByLabelText("Recovery code"), "123456");
  fireEvent.press(screen.getByText(/Verify.*(Create Account|Email)/));
}

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.mode;
  mockParams.email = "a@example.test";
  useRegistrationStore.getState().reset();
  useRegistrationStore.getState().setData({ email: "a@example.test", userSide: "tenant", acceptance, profileDetails });
  mockVerifyOtp.mockResolvedValue({ data: { user: { id: "auth-1", email: "a@example.test" } }, error: null });
  mockRpc.mockResolvedValue({ data: "internal-1", error: null });
  mockResend.mockResolvedValue({ error: null });
  mockSignOut.mockResolvedValue({ error: null });
  mockSwitchTo.mockResolvedValue(undefined);
});

it("commits signup profile and the explicitly selected revisions together after email verification", async () => {
  render(<OTPVerification />);
  await verify();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/personalization/step-one"));
  expect(mockRpc).toHaveBeenCalledWith("complete_mobile_registration", {
    profile_details: profileDetails, requested_role: "tenant", terms_accepted: true, privacy_accepted: true,
    terms_version: "1.1", privacy_version: "1.0", registration_source: "mobile_registration", expected_auth_id: "auth-1",
  });
  expect(useRegistrationStore.getState().data).toEqual({});
});

it("blocks verification and resending if acceptance was lost", async () => {
  useRegistrationStore.getState().setData({ acceptance: emptyRegistrationAcceptance() });
  render(<OTPVerification />);
  await verify();
  fireEvent.press(screen.getByText("Resend"));
  expect(mockVerifyOtp).not.toHaveBeenCalled();
  expect(mockResend).not.toHaveBeenCalled();
  expect(screen.getByText("Please read and accept the Privacy Policy.")).toBeTruthy();
});

it("does not let a different email consume the staged acceptance", async () => {
  mockParams.email = "other@example.test";
  render(<OTPVerification />);
  await verify();
  expect(mockVerifyOtp).not.toHaveBeenCalled();
  expect(mockRpc).not.toHaveBeenCalled();
});

it("retains the selections on a wrong code and on resend", async () => {
  mockVerifyOtp.mockResolvedValue({ data: {}, error: { message: "Token has expired or is invalid" } });
  render(<OTPVerification />);
  await verify();
  await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalled());
  fireEvent.press(screen.getByText("Resend"));
  await waitFor(() => expect(mockResend).toHaveBeenCalledWith({ type: "signup", email: "a@example.test" }));
  expect(useRegistrationStore.getState().data.acceptance).toEqual(acceptance);
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(mockRpc).not.toHaveBeenCalled();
});

it("signs out a verified session on stale acceptance, with inline recovery instructions and no portal entry", async () => {
  mockRpc.mockResolvedValue({ data: null, error: { message: POLICY_UPDATE_MESSAGE } });
  render(<OTPVerification />);
  await verify();
  await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  expect(screen.getByText(POLICY_UPDATE_MESSAGE)).toBeTruthy();
  expect(mockSwitchTo).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(useRegistrationStore.getState().data).toEqual({});
});

it("preserves confirm-email recovery without requiring nonexistent signup data", async () => {
  useRegistrationStore.getState().reset();
  mockParams.mode = "confirm";
  mockMissing.mockResolvedValue(true);
  render(<OTPVerification />);
  await verify();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/finish-profile"));
  expect(mockRpc).not.toHaveBeenCalled();
});
