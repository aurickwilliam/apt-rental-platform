import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import SignIn from "./sign-in";
import { useSuspensionStore } from "@/stores/useSuspensionStore";

const mockReplace = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSingle = jest.fn();
const mockRestore = jest.fn();
const mockGetStatus = jest.fn();
const mockErrorDialog = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn() }) }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("constants/images", () => ({ IMAGES: { logo: "logo.png", googleLogo: "google.png" } }));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockScreenWrapper({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock("./components/AuthDivider", () => () => null);
jest.mock("./components/AuthButton", () => () => null);
jest.mock("@/components/display/ErrorDialog", () => (props: unknown) => {
  mockErrorDialog(props);
  return null;
});
jest.mock("@/service/auth/suspensionService", () => ({
  ...jest.requireActual("@/service/auth/suspensionService"),
  getMySuspensionStatus: (...args: unknown[]) => mockGetStatus(...args),
}));
jest.mock("hooks/auth", () => ({
  useGoogleAuth: () => ({ signInWithGoogle: jest.fn(), loading: false, error: "", errorTitle: undefined, resetError: jest.fn() }),
}));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { white: "#fff", gray400: "#999" } }) }));
jest.mock("@/utils/queryClient", () => ({ clearQueryClient: jest.fn() }));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: { getState: () => ({ restore: (...args: unknown[]) => mockRestore(...args) }) },
}));
jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: () => mockSingle() }) }) }),
  },
}));
jest.mock("heroui-native", () => {
  const { Text, TextInput, TouchableOpacity, View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Button = Object.assign(
    ({ children, onPress, isDisabled }: { children: React.ReactNode; onPress: () => void; isDisabled?: boolean }) => (
      <TouchableOpacity onPress={onPress} disabled={isDisabled}>{children}</TouchableOpacity>
    ),
    { Label: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> },
  );
  const LinkButton = Object.assign(
    ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
    { Label: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> },
  );
  return {
    Button,
    LinkButton,
    Text,
    TextField: View,
    Label: Text,
    FieldError: Text,
    Input: TextInput,
    InputGroup: Object.assign(View, { Input: TextInput, Suffix: View }),
    Spinner: () => null,
  };
});

describe("role-neutral mobile sign-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: "account-a" } }, error: null });
    mockSingle.mockResolvedValue({ data: { roles: ["landlord", "tenant"] }, error: null });
    mockRestore.mockResolvedValue("tenant");
    mockSignOut.mockResolvedValue({ error: null });
    mockGetStatus.mockResolvedValue({ suspended: false, reason: null });
  });

  it("does not show tenant and landlord tabs and restores the saved portal", async () => {
    render(<SignIn />);
    expect(screen.queryByText("Tenant")).toBeNull();
    expect(screen.queryByText("Landlord")).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => expect(mockRestore).toHaveBeenCalledWith("account-a", ["landlord", "tenant"]));
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(tenant)/rentals");
  });

  it("signs out a suspended account and shows the reason", async () => {
    mockGetStatus.mockResolvedValue({ suspended: true, reason: "Fake listings" });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() =>
      expect(mockErrorDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          title: "Account suspended",
          message: expect.stringContaining("Reason: Fake listings"),
        }),
      ),
    );
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSingle).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows the notice left by the suspension guard", async () => {
    useSuspensionStore.getState().show("Fake listings");
    render(<SignIn />);

    await waitFor(() =>
      expect(mockErrorDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isOpen: true,
          title: "Account suspended",
          message: expect.stringContaining("Reason: Fake listings"),
        }),
      ),
    );
  });

  it("signs out admin-only accounts without routing to a portal", async () => {
    mockSingle.mockResolvedValue({ data: { roles: ["admin"] }, error: null });
    render(<SignIn />);

    fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "a@example.test");
    fireEvent.changeText(screen.getByPlaceholderText("Enter your password"), "password");
    fireEvent.press(screen.getByText("Sign In"));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockRestore).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
