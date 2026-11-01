import { act, renderHook } from "@testing-library/react-native";

import { usePasswordValidation } from "@repo/hooks";

import { useProfileDetailsForm } from "./useProfileDetailsForm";
import { useSignUpProfile } from "./useSignUpProfile";
import { useRegistrationStore } from "@/stores/useRegistrationStore";
import { emptyRegistrationAcceptance } from "@/service/auth/registrationAcceptance";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRequestSignUpCode = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
jest.mock("@/service/auth/signUpService", () => ({
  requestSignUpCode: (...args: unknown[]) => mockRequestSignUpCode(...args),
}));

function setup() {
  return renderHook(() => {
    const form = useProfileDetailsForm({ scrollRef: { current: null } });
    const passwords = usePasswordValidation();
    return {
      form,
      passwords,
      flow: useSignUpProfile({ form, passwords, email: "a@example.test", userSide: "landlord" }),
    };
  });
}

function fillValid(hook: () => ReturnType<typeof setup>["result"]["current"], password = "Passw0rd!") {
  act(() => {
    const { form } = hook();
    form.setField("firstName", "Ana");
    form.setField("lastName", "Lim");
    form.setField("suffixName", "Jr.");
    form.setField("gender", "Female");
    form.setField("birthDate", "1990-01-05");
    form.setField("streetAddress", "1 Main St");
    form.setProvince("Metro Manila");
  });
  act(() => hook().form.setCity("Caloocan"));
  act(() => {
    const { form, passwords } = hook();
    form.setField("barangay", "Barangay 1");
    form.mobile.onChange("09171234567");
    form.postal.onChange("1400");
    passwords.setPassword(password);
    passwords.setConfirmPassword(password);
    hook().flow.policies.setAccepted("privacyAccepted", true);
    hook().flow.policies.setAccepted("termsAccepted", true);
  });
}

describe("useSignUpProfile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useRegistrationStore.getState().reset();
    mockRequestSignUpCode.mockResolvedValue(undefined);
  });

  it("does not create the account while the password is missing or weak", async () => {
    const { result } = setup();
    fillValid(() => result.current, "weak");

    await act(async () => { await result.current.flow.submit(); });

    expect(mockRequestSignUpCode).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("creates the account, keeps the details for verification and continues to the code step", async () => {
    const { result } = setup();
    fillValid(() => result.current);

    await act(async () => { await result.current.flow.submit(); });

    expect(mockRequestSignUpCode).toHaveBeenCalledWith({
      email: "a@example.test",
      password: "Passw0rd!",
      fullName: "Ana Lim Jr.",
      acceptance: { ...emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true },
    });
    expect(useRegistrationStore.getState().data).toMatchObject({
      email: "a@example.test",
      firstName: "Ana",
      suffixName: "Jr.",
      postalCode: "1400",
      mobileNumber: "09171234567",
      password: "Passw0rd!",
      userSide: "landlord",
      acceptance: { ...emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true },
      profileDetails: expect.objectContaining({ first_name: "Ana", suffix: "Jr.", mobile_number: "09171234567" }),
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/otp-verification",
      params: { email: "a@example.test" },
    });
  });

  it("shows the wait time from a throttled code request", async () => {
    mockRequestSignUpCode.mockRejectedValue(new Error("For security purposes, you can only request this after 42 seconds."));
    const { result } = setup();
    fillValid(() => result.current);

    await act(async () => { await result.current.flow.submit(); });

    expect(result.current.flow.error).toBe("Please wait 42 seconds before requesting another code.");
    expect(result.current.flow.errorDialogOpen).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("clears the kept details when going back", () => {
    useRegistrationStore.getState().setData({ firstName: "Ana" });
    const { result } = setup();

    act(() => result.current.flow.goBack());

    expect(useRegistrationStore.getState().data).toEqual({});
    expect(mockBack).toHaveBeenCalled();
  });

  it("requires both policies even if submit is called directly", async () => {
    const { result } = setup();
    fillValid(() => result.current);
    act(() => result.current.flow.policies.setAccepted("termsAccepted", false));
    await act(async () => { await result.current.flow.submit(); });
    expect(mockRequestSignUpCode).not.toHaveBeenCalled();
    expect(result.current.flow.policies.errors.termsAccepted).toBeTruthy();
    expect(useRegistrationStore.getState().data).toEqual({});
  });

  it("does not request twice or revive the draft after leaving during a code request", async () => {
    let resolveRequest!: () => void;
    mockRequestSignUpCode.mockImplementation(() => new Promise<void>((resolve) => { resolveRequest = resolve; }));
    const { result } = setup();
    fillValid(() => result.current);
    let request!: Promise<void>;
    act(() => { request = result.current.flow.submit(); });
    await act(async () => { await result.current.flow.submit(); });
    expect(mockRequestSignUpCode).toHaveBeenCalledTimes(1);
    act(() => result.current.flow.goBack());
    await act(async () => { resolveRequest(); await request; });
    expect(useRegistrationStore.getState().data).toEqual({});
    expect(mockPush).not.toHaveBeenCalled();
  });
});
