import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
  const { View, Image, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  const Avatar = Object.assign(({ children }: { children: ReactNode }) => React.createElement(View, null, children), {
    Image,
    // Real Avatar.Fallback wraps its initials in a Text node — a raw string
    // breaks RN's text-in-Text rule under the v14 test renderer.
    Fallback: ({ children }: { children: ReactNode }) => React.createElement(Text, null, children),
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

async function setup() {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity },
  } });
  client.setQueryData(CURRENT_USER_QUERY_KEY, mockProfile);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return await render(<EditProfile />, { wrapper });
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
    await setup();
    expect(screen.getByText("Personal Information")).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
    expect(screen.getByText("Address")).toBeTruthy();
    for (const label of ["Email", "First Name", "Middle Name", "Last Name", "Suffix", "Birth Date"]) {
      expect(screen.getByLabelText(`${label} (read-only)`).props.editable).toBe(false);
    }
    expect(screen.getByLabelText("Suffix (read-only)").props.value).toBe("Jr.");
    expect(screen.getByRole("button", { name: "Save Changes" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Mobile Number"), "09181234567");
    await fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText("Profile Updated")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Dismiss success" }));
    expect(mockRouter.replace).toHaveBeenCalledWith(`/(tabs)/(${portal})/profile`);
  });

  it.each(["tenant", "landlord"])("returns a dual-role account to the active %s portal", async (portal) => {
    mockPortal = portal;
    mockProfile = { ...profileFixture, roles: ["tenant", "landlord"] };
    mockRouter.canGoBack.mockReturnValue(false);
    await setup();
    await fireEvent.changeText(screen.getByLabelText("Mobile Number"), "09181234567");
    await fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    await screen.findByText("Profile Updated");
    await fireEvent.press(screen.getByRole("button", { name: "Dismiss success" }));
    expect(mockRouter.replace).toHaveBeenCalledWith(`/(tabs)/(${portal})/profile`);
  });

  it("previews photos locally and includes the staged selection only on Save", async () => {
    await setup();
    await fireEvent.press(screen.getByRole("button", { name: "Change background photo" }));
    await waitFor(() => expect(screen.getByLabelText("Background photo preview").props.source).toEqual({ uri: "file:///selected.jpg" }));
    expect(mockSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save Changes" }).props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    // React Query 5.107 hands mutationFn its context as a second argument, so assert on the payload itself.
    await waitFor(() => expect(mockSave.mock.lastCall?.[0]).toEqual(expect.objectContaining({
      photos: { avatar: null, background: { uri: "file:///selected.jpg", width: 1200, height: 800 } },
    })));
  });

  it.each(["Back", "Cancel"])("guards %s, preserves edits with Keep Editing, and exits only after Discard", async (button) => {
    await setup();
    await fireEvent.changeText(screen.getByLabelText("Street Address"), "Unsaved address");
    await fireEvent.press(screen.getByRole("button", { name: button }));
    expect(screen.getByText("Discard changes?")).toBeTruthy();
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Keep Editing" }));
    expect(screen.getByLabelText("Street Address").props.value).toBe("Unsaved address");
    await fireEvent.press(screen.getByRole("button", { name: button }));
    await fireEvent.press(screen.getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(mockNavigation.dispatch).toHaveBeenCalledWith(mockAction));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("also guards navigation gestures and hardware back through the removal callback", async () => {
    await setup();
    await fireEvent.changeText(screen.getByLabelText("Street Address"), "Unsaved address");
    expect(mockGuard.enabled).toBe(true);
    await act(() => mockGuard.callback({ data: { action: mockAction } }));
    expect(screen.getByText("Discard changes?")).toBeTruthy();
  });

  it("allows leaving a pristine form without confirmation or a write", async () => {
    await setup();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Discard changes?")).toBeNull();
    expect(mockNavigate).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it.each(["tenant", "landlord"])("keeps Save disabled without changes in the %s portal, including after edits are reverted", async (portal) => {
    mockPortal = portal;
    mockProfile = { ...profileFixture, roles: [portal] };
    await setup();
    const saveButton = () => screen.getByRole("button", { name: "Save Changes" });
    expect(await saveButton().props.accessibilityState.disabled).toBe(true);
    expect(await saveButton().props.className).toBe("flex-1 opacity-50");
    await fireEvent.press(await saveButton());
    expect(mockSave).not.toHaveBeenCalled();

    // Focusing/blurring or re-entering the saved value is not an edit.
    const address = screen.getByLabelText("Street Address");
    await fireEvent(address, "blur");
    await fireEvent.changeText(address, profileFixture.street_address);
    expect(await saveButton().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(address, "Changed address");
    expect(await saveButton().props.accessibilityState.disabled).toBe(false);
    expect(await saveButton().props.className).toBe("flex-1");
    await fireEvent.changeText(address, profileFixture.street_address);
    expect(await saveButton().props.accessibilityState.disabled).toBe(true);
    expect(await saveButton().props.className).toBe("flex-1 opacity-50");
    await fireEvent.press(await saveButton());
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("places soft-danger Cancel on the left and Save Changes on the right", async () => {
    await setup();
    const actions = screen.getAllByText(/^(Cancel|Save Changes)$/);
    expect(actions.map((action) => action.props.children)).toEqual(["Cancel", "Save Changes"]);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel.props.variant).toBe("danger-soft");
    expect(cancel.props.className).toBe("flex-1");
    expect(cancel.props.accessibilityState.disabled).toBe(false);
  });

  it("shows inline validation and preserves input while profile data refreshes", async () => {
    const { rerender } = await setup();
    await fireEvent.changeText(screen.getByLabelText("Mobile Number"), "123");
    await fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText(/Mobile number must be 11 digits/)).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
    mockProfile = { ...profileFixture, mobile_number: "09191234567" };
    await rerender(<EditProfile />);
    expect(screen.getByLabelText("Mobile Number").props.value).toBe("123");
    await fireEvent.changeText(screen.getByLabelText("Mobile Number"), "09181234567");
    expect(screen.queryByText(/Mobile number must be 11 digits/)).toBeNull();
  });

  it("disables fields, photo buttons, Cancel and repeated saves while a write is pending", async () => {
    let finish: (value: unknown) => void = () => {};
    mockSave.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    await setup();
    await fireEvent.changeText(screen.getByLabelText("Street Address"), "New address");
    await fireEvent.press(screen.getByRole("button", { name: "Save Changes" }));
    await screen.findByText("Saving...");
    expect(screen.getByLabelText("Street Address").props.editable).toBe(false);
    expect(screen.getByRole("button", { name: "Change profile photo" }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Cancel" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    await act(() => mockGuard.callback({ data: { action: mockAction } }));
    expect(screen.queryByText("Discard changes?")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Saving..." }));
    expect(mockSave).toHaveBeenCalledTimes(1);
    await act(async () => finish(profileFixture));
  });

  it("offers retry when the profile cannot be loaded", async () => {
    mockProfile = null;
    await setup();
    expect(screen.getByText("Unable to load your profile. Please try again.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try Again" }));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("does not expose the consumer editor for admin profiles", async () => {
    mockProfile = { ...profileFixture, roles: ["admin"] };
    await setup();
    expect(screen.queryByText("Personal Information")).toBeNull();
  });
});
