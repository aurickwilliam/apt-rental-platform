import { render, waitFor } from "@testing-library/react-native";

import TabsLayout from "./_layout";
import { usePortalStore } from "@/stores/usePortalStore";

const mockReplace = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
let mockGroup = "(landlord)";
let mockRoles = ["tenant", "landlord"];

jest.mock("expo-router", () => ({
  Stack: Object.assign(() => null, { Screen: () => null }),
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => ["(tabs)", mockGroup],
}));

jest.mock("hooks/auth", () => ({
  useProfile: () => ({ profile: { user_id: "account-a", roles: mockRoles }, loading: false }),
}));

jest.mock("@repo/supabase", () => ({
  supabase: { auth: { signOut: () => mockSignOut() } },
}));

describe("mobile portal tab guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGroup = "(landlord)";
    mockRoles = ["tenant", "landlord"];
    usePortalStore.getState().reset();
    usePortalStore.setState({ authUserId: "account-a", portal: "landlord", loading: false });
  });

  it("allows a dual-role account in its selected non-primary portal", () => {
    render(<TabsLayout />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("redirects a tab group that is not the active portal", async () => {
    mockGroup = "(tenant)";
    render(<TabsLayout />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(landlord)/dashboard"));
  });

  it("allows a single-role tenant in the tenant tab group", () => {
    mockRoles = ["tenant"];
    mockGroup = "(tenant)";
    usePortalStore.setState({ authUserId: "account-a", portal: "tenant", loading: false });
    render(<TabsLayout />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("rejects admin-only mobile sessions", async () => {
    mockRoles = ["admin"];
    render(<TabsLayout />);
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
  });
});
