import { act, renderHook } from "@testing-library/react-native";

import { usePasswordValidation } from "@repo/hooks";

import { useProfileDetailsForm } from "./useProfileDetailsForm";
import { useSignUpProfile } from "./useSignUpProfile";
import { useRegistrationStore } from "@/stores/useRegistrationStore";

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
    });
    expect(useRegistrationStore.getState().data).toMatchObject({
      email: "a@example.test",
      firstName: "Ana",
      suffixName: "Jr.",
      postalCode: "1400",
      mobileNumber: "09171234567",
      password: "Passw0rd!",
      userSide: "landlord",
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
});
