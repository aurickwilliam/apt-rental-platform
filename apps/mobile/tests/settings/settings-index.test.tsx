import { fireEvent, render, screen, within } from "@testing-library/react-native";

import Settings from "@/app/settings/index";

const mockRouter = { push: jest.fn() };
let mockPasswordStatus: "has_password" | "no_password" | undefined;
let mockEmailEligibility: "eligible" | "google" | undefined;

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

jest.mock("heroui-native", () => jest.requireActual("../support/heroUINativeStub"));

jest.mock("@/hooks/auth", () => ({
  usePasswordSignInStatus: () => ({ data: mockPasswordStatus }),
  useEmailChangeEligibility: () => ({ data: mockEmailEligibility }),
}));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { textPrimary: "#333", gray500: "#6C757D", danger: "#DC3545" } }),
  useThemePreference: () => ({ themeMode: "system", setThemeMode: jest.fn() }),
}));

jest.mock("@/hooks/notifications", () => ({
  useNotificationPreferences: () => ({ preferences: { notifications_enabled: true, push_enabled: true } }),
}));

jest.mock("@/hooks/preferences/useUserPreferences", () => ({
  useUserPreferences: () => ({ preferences: null, hasPrefs: false }),
}));

jest.mock("@/app/settings/components/AppearanceSheet", () => ({
  __esModule: true,
  default: () => null,
  getThemeModeLabel: () => "System",
}));

jest.mock("@/components/layout/ScreenWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));

// A settings row is the ListGroup.Item (button) that contains its title.
function rowFor(title: string) {
  let node = screen.getByText(title).parent;
  while (node && node.props.accessibilityRole !== "button") node = node.parent;
  if (!node) throw new Error(`${title} row not found`);
  return node;
}

const changePasswordRow = () => rowFor("Change Password");

describe("Settings › Change Password row", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPasswordStatus = undefined;
    mockEmailEligibility = undefined;
  });

  it("opens Change Password for accounts with a password", () => {
    mockPasswordStatus = "has_password";
    render(<Settings />);

    expect(changePasswordRow().props.accessibilityState.disabled).toBe(false);
    fireEvent.press(changePasswordRow());
    expect(mockRouter.push).toHaveBeenCalledWith("/settings/change-password");
  });

  it("explains that Google-only accounts have no password to change", () => {
    mockPasswordStatus = "no_password";
    render(<Settings />);

    expect(screen.getByText("Signed in with Google")).toBeTruthy();
    expect(changePasswordRow().props.accessibilityState.disabled).toBe(true);
    fireEvent.press(changePasswordRow());
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("stays disabled while the account type is loading or unavailable", () => {
    render(<Settings />);

    expect(changePasswordRow().props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText("Signed in with Google")).toBeNull();
    fireEvent.press(changePasswordRow());
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("opens Change Email for email/password accounts without Google", () => {
    mockPasswordStatus = "has_password";
    mockEmailEligibility = "eligible";
    render(<Settings />);

    const changeEmailRow = rowFor("Change Email");
    expect(changeEmailRow.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(changeEmailRow);
    expect(mockRouter.push).toHaveBeenCalledWith("/settings/change-email");
  });

  it("explains that Google sign-in accounts cannot change email here", () => {
    mockPasswordStatus = "has_password";
    mockEmailEligibility = "google";
    render(<Settings />);

    const changeEmailRow = rowFor("Change Email");
    expect(within(changeEmailRow).getByText("Signed in with Google")).toBeTruthy();
    expect(changeEmailRow.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(changeEmailRow);
    expect(mockRouter.push).not.toHaveBeenCalledWith("/settings/change-email");
  });

  it("keeps Change Email disabled while eligibility is loading", () => {
    mockPasswordStatus = "has_password";
    render(<Settings />);

    const changeEmailRow = rowFor("Change Email");
    expect(changeEmailRow.props.accessibilityState.disabled).toBe(true);
  });
});
