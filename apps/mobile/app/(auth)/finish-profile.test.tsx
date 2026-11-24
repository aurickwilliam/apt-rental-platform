import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import FinishProfile from "./finish-profile";
import { readAndCloseRegistrationPolicy } from "@/tests/support/registrationPolicy";

const mockParams: Record<string, string> = {};
const mockFinishProfile = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: jest.fn() }),
  useNavigation: () => ({ dispatch: jest.fn() }),
}));
jest.mock("expo-router/react-navigation", () => ({ usePreventRemove: jest.fn() }));
jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockScreenWrapper({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock("@/components/inputs/DropdownField", () => () => null);
jest.mock("@/components/inputs/DateField", () => () => null);
jest.mock("@/components/display/ErrorDialog", () => () => null);
jest.mock("./components/RoleTab", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockRoleTab({ userSide }: { userSide: string }) { return <Text>{`Role tab: ${userSide}`}</Text>; };
});
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { white: "#fff" } }) }));
jest.mock("@repo/supabase", () => ({ supabase: { auth: { signOut: jest.fn() } } }));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: { getState: () => ({ switchTo: jest.fn() }) } }));
jest.mock("@/utils/queryClient", () => ({ clearQueryClient: jest.fn() }));
jest.mock("@/service/auth/finishProfileService", () => ({
  finishProfile: (...args: unknown[]) => mockFinishProfile(...args),
}));

function setParams(params: Record<string, string>) {
  for (const key of Object.keys(mockParams)) delete mockParams[key];
  Object.assign(mockParams, params);
}

describe("FinishProfile screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setParams({ email: "a@example.test", firstName: "Maria", lastName: "Dela Cruz" });
  });

  it("prefills the names from the sign-in provider and shows the email read-only", async () => {
    await render(<FinishProfile />);

    expect(screen.getByDisplayValue("Maria")).toBeTruthy();
    expect(screen.getByDisplayValue("Dela Cruz")).toBeTruthy();
    expect(screen.getByDisplayValue("a@example.test")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Create a password")).toBeNull();
  });

  it("offers the account type choice only when none was chosen before", async () => {
    const { unmount } = await render(<FinishProfile />);
    expect(screen.getByText("Choose your account type")).toBeTruthy();
    expect(screen.getByText("Role tab: tenant")).toBeTruthy();
    await unmount();

    setParams({ email: "a@example.test", userSide: "landlord" });
    await render(<FinishProfile />);
    expect(screen.queryByText("Choose your account type")).toBeNull();
    expect(screen.getByText(/Complete Your Landlord Profile/)).toBeTruthy();
  });

  it("starts from the suggested role", async () => {
    setParams({ email: "a@example.test", suggestedRole: "landlord" });
    await render(<FinishProfile />);

    expect(screen.getByText("Role tab: landlord")).toBeTruthy();
  });

  it("offers a way out only for an account with no profile", async () => {
    const { unmount } = await render(<FinishProfile />);
    expect(screen.queryByText("Use a different account")).toBeNull();
    await unmount();

    setParams({ email: "a@example.test", profileMissing: "1" });
    await render(<FinishProfile />);
    expect(screen.getByText("Use a different account")).toBeTruthy();
  });

  it("keeps what is typed in the street address", async () => {
    await render(<FinishProfile />);

    await fireEvent.changeText(screen.getByPlaceholderText("Enter your street address"), "1 Main St");
    await readAndCloseRegistrationPolicy("Privacy Policy");

    expect(screen.getByDisplayValue("1 Main St")).toBeTruthy();
  });

  it("shows the required errors and saves nothing for an empty form", async () => {
    setParams({ email: "a@example.test" });
    await render(<FinishProfile />);

    await readAndCloseRegistrationPolicy("Privacy Policy");
    await readAndCloseRegistrationPolicy("Terms and Conditions");
    await fireEvent.press(screen.getByLabelText("I have read and agree to the Privacy Policy"));
    await fireEvent.press(screen.getByLabelText("I have read and agree to the Terms and Conditions"));
    await fireEvent.press(screen.getByText("Submit"));

    await waitFor(() => expect(screen.getAllByText("This field is required").length).toBeGreaterThan(0));
    expect(mockFinishProfile).not.toHaveBeenCalled();
  });
});
