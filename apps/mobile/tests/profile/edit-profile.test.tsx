import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "heroui-native";

import EditProfile from "@/app/edit-profile";
import { profileFixture } from "./fixtures";
import { CURRENT_USER_QUERY_KEY } from "@/utils/queryClient";

const mockSave = jest.fn();
const mockPick = jest.fn();
const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
let mockProfile: typeof profileFixture | null = profileFixture;
let mockLoading = false;
let mockPortal = "tenant";
let mockGuard: { enabled: boolean; callback: (event: { data: { action: { type: string } } }) => void };
const mockAction = { type: "GO_BACK" };
const mockRouter = {
  canGoBack: jest.fn(() => true),
  back: jest.fn(() => {
    if (mockGuard.enabled) mockGuard.callback({ data: { action: mockAction } });
    else mockNavigate();
  }),
  replace: jest.fn(),
};
const mockNavigation = { dispatch: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useNavigation: () => mockNavigation,
  Redirect: () => null,
}));
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: (enabled: boolean, callback: typeof mockGuard.callback) => { mockGuard = { enabled, callback }; },
}));
jest.mock("@/hooks/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: mockProfile, isLoading: mockLoading, refetch: mockRefetch }),
}));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: () => mockPortal }));
jest.mock("@repo/supabase", () => ({ supabase: {} }));
jest.mock("@/utils/compressImage", () => ({}));
jest.mock("@/utils/queryClient", () => ({ CURRENT_USER_QUERY_KEY: ["current-user"] }));
jest.mock("@/service/auth/profileService", () => ({
  ...jest.requireActual("@/service/auth/profileService"),
  saveProfile: (...args: unknown[]) => mockSave(...args),
  pickProfilePhoto: (...args: unknown[]) => mockPick(...args),
}));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: {
  primary: "#376BF5", primaryLightForeground: "#2F5FE0", textSecondary: "#626B73", secondaryForeground: "#FFFFFF",
} }) }));
jest.mock("expo-image", () => ({ Image: jest.requireActual("react-native").Image }));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View, Image } = jest.requireActual<typeof import("react-native")>("react-native");
  const Avatar = Object.assign(({ children }: { children: ReactNode }) => React.createElement(View, null, children), {
    Image, Fallback: ({ children }: { children: ReactNode }) => React.createElement(View, null, children),
  });
  return { ...jest.requireActual("../support/heroUINativeStub"), Avatar };
});
jest.mock("@/components/layout/ScreenWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return { __esModule: true, default: React.forwardRef(function Wrapper(
    { children, header }: { children: ReactNode; header: ReactNode }, _ref,
  ) { return React.createElement(React.Fragment, null, header, children); }) };
});
jest.mock("@/components/layout/StandardHeader", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ onBackPress }: { onBackPress: () => void }) => React.createElement(
    Pressable, { onPress: onBackPress, accessibilityRole: "button", accessibilityLabel: "Back" }, React.createElement(Text, null, "Back"),
  ) };
});
jest.mock("@/components/inputs/DropdownField", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { TextInput, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ label, value, onSelect, error, disabled }: {
    label: string; value: string; onSelect: (value: string) => void; error?: string; disabled: boolean;
  }) => React.createElement(View, null,
    React.createElement(TextInput, { accessibilityLabel: label, value, onChangeText: onSelect, editable: !disabled }),
    error ? React.createElement(Text, null, error) : null,
  ) };
});
jest.mock("@/components/display/ConfirmDialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ isOpen, title, onConfirm, onOpenChange }: {
    isOpen: boolean; title: string; onConfirm: () => void; onOpenChange: (open: boolean) => void;
  }) => isOpen ? React.createElement(View, null,
    React.createElement(Text, null, title),
    React.createElement(Pressable, { accessibilityRole: "button", accessibilityLabel: "Discard", onPress: onConfirm }),
    React.createElement(Pressable, { accessibilityRole: "button", accessibilityLabel: "Keep Editing", onPress: () => onOpenChange(false) }),
  ) : null };
});
jest.mock("@/components/display/ErrorDialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
    isOpen ? React.createElement(Text, null, message) : null };
});
jest.mock("@/components/display/SuccessDialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: ({ isOpen, title, onClose }: { isOpen: boolean; title: string; onClose: () => void }) =>
    isOpen ? React.createElement(Pressable, { accessibilityRole: "button", accessibilityLabel: "Dismiss success", onPress: onClose },
      React.createElement(Text, null, title)) : null };
});

function setup() {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity },
  } });
  client.setQueryData(CURRENT_USER_QUERY_KEY, mockProfile);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(<EditProfile />, { wrapper });
}

describe("mobile Edit Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile = profileFixture;
    mockLoading = false;
    mockPortal = "tenant";
    mockRouter.canGoBack.mockReturnValue(true);
    mockPick.mockResolvedValue({ uri: "file:///selected.jpg", width: 1200, height: 800 });
    mockSave.mockImplementation(async ({ fields }) => ({ ...profileFixture, ...fields, postal_code: Number(fields.postal_code) }));
  });

  it.each(["tenant", "landlord"])("offers the same form and returns to the %s profile", async (portal) => {
    mockPortal = portal;
    mockProfile = { ...profileFixture, roles: [portal] };
    mockRouter.canGoBack.mockReturnValue(false);
    setup();
    expect(screen.getByText("Personal Information")).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
    expect(screen.getByText("Address")).toBeTruthy();
    for (const label of ["Email", "First Name", "Middle Name", "Last Name", "Suffix", "Birth Date"]) {
      expect(screen.getByLabelText(`${label} (read-only)`).props.editable).toBe(false);
    }
    expect(screen.getByLabelText("Suffix (read-only)").props.value).toBe("Jr.");
    expect(screen.getByRole("button", { name: "Save Changes" }).props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText("Mobile Number"), "+639181234567");
    fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText("Profile Updated")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole("button", { name: "Dismiss success" }));
    expect(mockRouter.replace).toHaveBeenCalledWith(`/(tabs)/(${portal})/profile`);
  });

  it.each(["tenant", "landlord"])("returns a dual-role account to the active %s portal", async (portal) => {
    mockPortal = portal;
    mockProfile = { ...profileFixture, roles: ["tenant", "landlord"] };
    mockRouter.canGoBack.mockReturnValue(false);
    setup();
    fireEvent.changeText(screen.getByLabelText("Mobile Number"), "+639181234567");
    fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    await screen.findByText("Profile Updated");
    fireEvent.press(screen.getByRole("button", { name: "Dismiss success" }));
    expect(mockRouter.replace).toHaveBeenCalledWith(`/(tabs)/(${portal})/profile`);
  });

  it("previews photos locally and includes the staged selection only on Save", async () => {
    setup();
    fireEvent.press(screen.getByRole("button", { name: "Change background photo" }));
    await waitFor(() => expect(screen.getByLabelText("Background photo preview").props.source).toEqual({ uri: "file:///selected.jpg" }));
    expect(mockSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save Changes" }).props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      photos: { avatar: null, background: { uri: "file:///selected.jpg", width: 1200, height: 800 } },
    })));
  });

  it.each(["Back", "Cancel"])("guards %s, preserves edits with Keep Editing, and exits only after Discard", async (button) => {
    setup();
    fireEvent.changeText(screen.getByLabelText("Street Address"), "Unsaved address");
    fireEvent.press(screen.getByRole("button", { name: button }));
    expect(screen.getByText("Discard changes?")).toBeTruthy();
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole("button", { name: "Keep Editing" }));
    expect(screen.getByLabelText("Street Address").props.value).toBe("Unsaved address");
    fireEvent.press(screen.getByRole("button", { name: button }));
    fireEvent.press(screen.getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(mockNavigation.dispatch).toHaveBeenCalledWith(mockAction));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("also guards navigation gestures and hardware back through the removal callback", () => {
    setup();
    fireEvent.changeText(screen.getByLabelText("Street Address"), "Unsaved address");
    expect(mockGuard.enabled).toBe(true);
    act(() => mockGuard.callback({ data: { action: mockAction } }));
    expect(screen.getByText("Discard changes?")).toBeTruthy();
  });

  it("allows leaving a pristine form without confirmation or a write", () => {
    setup();
    fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Discard changes?")).toBeNull();
    expect(mockNavigate).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it.each(["tenant", "landlord"])("keeps Save disabled without changes in the %s portal, including after edits are reverted", (portal) => {
    mockPortal = portal;
    mockProfile = { ...profileFixture, roles: [portal] };
    setup();
    const saveButton = () => screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton().props.accessibilityState.disabled).toBe(true);
    expect(saveButton().props.className).toBe("flex-1 opacity-50");
    fireEvent.press(saveButton());
    expect(mockSave).not.toHaveBeenCalled();

    // Focusing/blurring or re-entering the saved value is not an edit.
    const address = screen.getByLabelText("Street Address");
    fireEvent(address, "blur");
    fireEvent.changeText(address, profileFixture.street_address);
    expect(saveButton().props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(address, "Changed address");
    expect(saveButton().props.accessibilityState.disabled).toBe(false);
    expect(saveButton().props.className).toBe("flex-1");
    fireEvent.changeText(address, profileFixture.street_address);
    expect(saveButton().props.accessibilityState.disabled).toBe(true);
    expect(saveButton().props.className).toBe("flex-1 opacity-50");
    fireEvent.press(saveButton());
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("places soft-danger Cancel on the left and Save Changes on the right", () => {
    setup();
    const actions = screen.getAllByText(/^(Cancel|Save Changes)$/);
    expect(actions.map((action) => action.props.children)).toEqual(["Cancel", "Save Changes"]);
    const cancel = screen.UNSAFE_getAllByType(Button).find((button) =>
      button.props.variant === "danger-soft",
    );
    expect(cancel?.findByType(Button.Label).props.children).toBe("Cancel");
    expect(cancel?.props.className).toBe("flex-1");
    expect(screen.getByRole("button", { name: "Cancel" }).props.accessibilityState.disabled).toBe(false);
  });

  it("shows inline validation and preserves input while profile data refreshes", async () => {
    const { rerender } = setup();
    fireEvent.changeText(screen.getByLabelText("Mobile Number"), "123");
    fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText(/Invalid format/)).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
    mockProfile = { ...profileFixture, mobile_number: "09191234567" };
    rerender(<EditProfile />);
    expect(screen.getByLabelText("Mobile Number").props.value).toBe("123");
    fireEvent.changeText(screen.getByLabelText("Mobile Number"), "09181234567");
    expect(screen.queryByText(/Invalid format/)).toBeNull();
  });

  it("disables fields, photo buttons, Cancel and repeated saves while a write is pending", async () => {
    let finish: (value: unknown) => void = () => {};
    mockSave.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    setup();
    fireEvent.changeText(screen.getByLabelText("Street Address"), "New address");
    fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    await screen.findByText("Saving...");
    expect(screen.getByLabelText("Street Address").props.editable).toBe(false);
    expect(screen.getByRole("button", { name: "Change profile photo" }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Cancel" }).props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    act(() => mockGuard.callback({ data: { action: mockAction } }));
    expect(screen.queryByText("Discard changes?")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole("button", { name: "Saving..." }));
    expect(mockSave).toHaveBeenCalledTimes(1);
    await act(async () => finish(profileFixture));
  });

  it("offers retry when the profile cannot be loaded", () => {
    mockProfile = null;
    setup();
    expect(screen.getByText("Unable to load your profile. Please try again.")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Try Again" }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("does not expose the consumer editor for admin profiles", () => {
    mockProfile = { ...profileFixture, roles: ["admin"] };
    setup();
    expect(screen.queryByText("Personal Information")).toBeNull();
  });
});
