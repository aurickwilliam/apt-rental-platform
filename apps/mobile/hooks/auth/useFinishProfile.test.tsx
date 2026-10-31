import { act, renderHook } from "@testing-library/react-native";

import { useFinishProfile } from "./useFinishProfile";
import { useProfileDetailsForm } from "./useProfileDetailsForm";
import { emptyRegistrationAcceptance, POLICY_UPDATE_MESSAGE } from "@/service/auth/registrationAcceptance";

const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockFinishProfile = jest.fn();
const mockSwitchTo = jest.fn();
const mockSignOut = jest.fn();
const mockClearQueryClient = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useNavigation: () => ({ dispatch: mockDispatch }),
}));
jest.mock("expo-router/react-navigation", () => ({ usePreventRemove: jest.fn() }));
jest.mock("@repo/supabase", () => ({
  supabase: { auth: { signOut: (...args: unknown[]) => mockSignOut(...args) } },
}));
jest.mock("@/service/auth/finishProfileService", () => ({
  finishProfile: (...args: unknown[]) => mockFinishProfile(...args),
}));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: { getState: () => ({ switchTo: (...args: unknown[]) => mockSwitchTo(...args) }) },
}));
jest.mock("@/utils/queryClient", () => ({ clearQueryClient: () => mockClearQueryClient() }));

function setup(role: "tenant" | "landlord" = "tenant", requestedRole?: string) {
  return renderHook(() => {
    const form = useProfileDetailsForm({ scrollRef: { current: null } });
    const flow = useFinishProfile({ form, role, requestedRole });
    return { form, flow };
  });
}

function fillValid(form: () => ReturnType<typeof setup>["result"]["current"]["form"]) {
  act(() => {
    form().setField("firstName", "Ana");
    form().setField("lastName", "Lim");
    form().setField("gender", "Female");
    form().setField("birthDate", "1990-01-05");
    form().setField("streetAddress", "1 Main St");
    form().setProvince("Metro Manila");
  });
  act(() => form().setCity("Caloocan"));
  act(() => {
    form().setField("barangay", "Barangay 1");
    form().mobile.onChange("09171234567");
    form().postal.onChange("1400");
  });
}

describe("useFinishProfile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFinishProfile.mockResolvedValue("auth-1");
    mockSwitchTo.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("does not save while the form is invalid", async () => {
    const { result } = setup();
    act(() => {
      result.current.flow.policies.setAccepted("privacyAccepted", true);
      result.current.flow.policies.setAccepted("termsAccepted", true);
    });

    await act(async () => { await result.current.flow.submit(); });

    expect(mockFinishProfile).not.toHaveBeenCalled();
    expect(result.current.form.getError("firstName")).toBe("This field is required");
  });

  it("saves, activates the portal and sends a tenant to personalization", async () => {
    const { result } = setup("tenant", "tenant");
    fillValid(() => result.current.form);
    act(() => {
      result.current.flow.policies.setAccepted("privacyAccepted", true);
      result.current.flow.policies.setAccepted("termsAccepted", true);
    });

    await act(async () => { await result.current.flow.submit(); });

    expect(mockFinishProfile).toHaveBeenCalledWith({
      details: expect.objectContaining({ first_name: "Ana", mobile_number: "09171234567", postal_code: 1400 }),
      role: "tenant",
      requestedRole: "tenant",
      acceptance: { ...emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true },
    });
    expect(mockSwitchTo).toHaveBeenCalledWith("auth-1", ["tenant"], "tenant");
    expect(mockReplace).toHaveBeenCalledWith("/personalization/step-one");
  });

  it("sends a landlord to the dashboard", async () => {
    const { result } = setup("landlord");
    fillValid(() => result.current.form);
    act(() => {
      result.current.flow.policies.setAccepted("privacyAccepted", true);
      result.current.flow.policies.setAccepted("termsAccepted", true);
    });

    await act(async () => { await result.current.flow.submit(); });

    expect(mockReplace).toHaveBeenCalledWith("../(tabs)/(landlord)/dashboard");
  });

  it("shows a friendly message and stays put when saving fails", async () => {
    mockFinishProfile.mockRejectedValue(new Error("JWT expired"));
    const { result } = setup();
    fillValid(() => result.current.form);
    act(() => {
      result.current.flow.policies.setAccepted("privacyAccepted", true);
      result.current.flow.policies.setAccepted("termsAccepted", true);
    });

    await act(async () => { await result.current.flow.submit(); });

    expect(result.current.flow.error).toBe("Your session has expired. Please sign in again.");
    expect(result.current.flow.errorDialogOpen).toBe(true);
    expect(result.current.flow.loading).toBe(false);
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => result.current.flow.closeErrorDialog());
    expect(result.current.flow.errorDialogOpen).toBe(false);
  });

  it("signs out and clears cached data to leave with a different account", async () => {
    const { result } = setup();

    await act(async () => { await result.current.flow.signOut(); });

    expect(mockClearQueryClient).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
  });

  it("blocks missing acceptance and shows stale revisions inline without losing the profile draft", async () => {
    const { result } = setup();
    fillValid(() => result.current.form);
    await act(async () => { await result.current.flow.submit(); });
    expect(mockFinishProfile).not.toHaveBeenCalled();
    act(() => {
      result.current.flow.policies.setAccepted("privacyAccepted", true);
      result.current.flow.policies.setAccepted("termsAccepted", true);
    });
    mockFinishProfile.mockRejectedValue({ message: POLICY_UPDATE_MESSAGE });
    await act(async () => { await result.current.flow.submit(); });
    expect(result.current.flow.policies.errors.version).toBe(POLICY_UPDATE_MESSAGE);
    expect(result.current.flow.policies.value.termsAccepted).toBe(false);
    expect(result.current.form.values.firstName).toBe("Ana");
    expect(result.current.flow.errorDialogOpen).toBe(false);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
