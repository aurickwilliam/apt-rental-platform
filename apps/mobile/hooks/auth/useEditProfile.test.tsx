import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useEditProfile } from "./useEditProfile";
import { profileFixture } from "@/tests/profile/fixtures";
import { CURRENT_USER_QUERY_KEY } from "@/utils/queryClient";

const mockSave = jest.fn();
const mockPick = jest.fn();
jest.mock("@/service/auth/profileService", () => {
  // Keep snapshots/errors real; only the external operations are mocked.
  const actual = jest.requireActual("@/service/auth/profileService");
  return { ...actual, saveProfile: (...args: unknown[]) => mockSave(...args), pickProfilePhoto: (...args: unknown[]) => mockPick(...args) };
});
jest.mock("@repo/supabase", () => ({ supabase: {} }));
jest.mock("@/utils/compressImage", () => ({}));
jest.mock("@/utils/queryClient", () => ({ CURRENT_USER_QUERY_KEY: ["current-user"] }));

const photo = { uri: "file:///new-photo.jpg", width: 800, height: 800 };

function setup() {
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity },
  } });
  client.setQueryData(CURRENT_USER_QUERY_KEY, profileFixture);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(({ profile }: { profile: typeof profileFixture }) => useEditProfile(profile), {
    wrapper, initialProps: { profile: profileFixture },
  });
  return { ...hook, client };
}

describe("useEditProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockImplementation(async ({ fields }) => ({
      ...fields, postal_code: Number(fields.postal_code), avatar_url: profileFixture.avatar_url, background_url: profileFixture.background_url,
    }));
    mockPick.mockResolvedValue(photo);
  });

  it("starts pristine and keeps draft edits across background profile refreshes", () => {
    const { result, rerender } = setup();
    expect(result.current.dirty).toBe(false);
    act(() => result.current.updateField("street_address", "Draft address"));
    rerender({ profile: { ...profileFixture, street_address: "Server address", account_status: "pending" } });
    expect(result.current.fields.street_address).toBe("Draft address");
    expect(result.current.dirty).toBe(true);
    act(() => result.current.updateField("street_address", profileFixture.street_address!));
    expect(result.current.dirty).toBe(false);
  });

  it("ignores an unchanged save, including after a cancelled photo picker", async () => {
    const { result } = setup();
    await act(async () => { await result.current.save(); });
    expect(mockSave).not.toHaveBeenCalled();
    mockPick.mockResolvedValueOnce(null);
    await act(async () => { await result.current.pickPhoto("avatar"); });
    expect(result.current.dirty).toBe(false);
    await act(async () => { await result.current.save(); });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("resets dependent address selections and lets users correct auto-filled postal codes", () => {
    const { result } = setup();
    act(() => result.current.updateField("province", "Bulacan"));
    expect(result.current.fields).toMatchObject({ city: "", barangay: "", postal_code: "" });
    act(() => result.current.updateField("city", "Malolos"));
    expect(result.current.fields.barangay).toBe("");
    act(() => result.current.changePostal("30x00"));
    expect(result.current.fields.postal_code).toBe("3000");
  });

  it.each(["09", "+631234567890", "08171234567"])("rejects invalid mobile number %s", async (phone) => {
    const { result } = setup();
    act(() => result.current.changeMobile(phone));
    let firstError: string | null = null;
    await act(async () => { firstError = await result.current.save(); });
    expect(firstError).toBe("mobile_number");
    expect(result.current.errors.mobile_number).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it.each(["", "999", "0000"])("rejects invalid postal code %s", async (zip) => {
    const { result } = setup();
    act(() => result.current.changePostal(zip));
    await act(async () => { await result.current.save(); });
    expect(result.current.errors.postal_code).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("validates all required fields and the gender whitelist before saving", async () => {
    const { result } = setup();
    act(() => {
      result.current.updateField("gender", "invalid");
      result.current.updateField("street_address", " ");
      result.current.updateField("province", "");
    });
    await act(async () => { await result.current.save(); });
    expect(result.current.errors).toMatchObject({
      gender: "Invalid gender.", street_address: "Street address is required.",
      province: "Province is required.", city: "City is required.", barangay: "Barangay is required.", postal_code: "Postal code is required.",
    });
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("stages photos without saving and does not lose a previous selection on picker cancel", async () => {
    const { result } = setup();
    await act(async () => { await result.current.pickPhoto("avatar"); });
    expect(result.current.photos.avatar).toEqual(photo);
    expect(result.current.dirty).toBe(true);
    expect(mockSave).not.toHaveBeenCalled();
    mockPick.mockResolvedValueOnce(null);
    await act(async () => { await result.current.pickPhoto("avatar"); });
    expect(result.current.photos.avatar).toEqual(photo);
  });

  it("normalizes international mobile numbers, clears drafts and refreshes the shared profile on success", async () => {
    const { result, client } = setup();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    act(() => result.current.changeMobile("+639181234567"));
    await act(async () => { await result.current.pickPhoto("background"); });
    await act(async () => { await result.current.save(); });
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      authUserId: "auth-1", fields: expect.objectContaining({ mobile_number: "09181234567" }), photos: { avatar: null, background: photo },
    }));
    expect(result.current.fields.mobile_number).toBe("09181234567");
    expect(result.current.photos).toEqual({ avatar: null, background: null });
    expect(result.current.succeeded).toBe(true);
    expect(result.current.dirty).toBe(false);
    expect(client.getQueryData(CURRENT_USER_QUERY_KEY)).toMatchObject({ mobile_number: "09181234567", suffix: "Jr." });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CURRENT_USER_QUERY_KEY, exact: true });
  });

  it("retains drafts/photos on failure and never logs backend PII", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSave.mockRejectedValueOnce(new Error("backend echoed 09181234567 and private address"));
    const { result } = setup();
    await act(async () => { await result.current.pickPhoto("avatar"); });
    await act(async () => { await result.current.save(); });
    expect(result.current.photos.avatar).toEqual(photo);
    expect(result.current.dirty).toBe(true);
    expect(result.current.succeeded).toBe(false);
    expect(result.current.errorMessage).toBe("Couldn't save your profile. Please try again.");
    expect(consoleError).toHaveBeenCalledWith("Profile edit failed:", {
      name: "Error", code: undefined, status: undefined,
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("09181234567");
    consoleError.mockRestore();
  });

  it("logs a plain backend error's code without its message, details or profile data", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSave.mockRejectedValueOnce({
      code: "42501", status: 403,
      message: "backend echoed 09181234567 and private address",
      details: "private profile details", hint: "private account hint",
    });
    const { result } = setup();
    act(() => result.current.changeMobile("09181234567"));
    await act(async () => { await result.current.save(); });
    expect(consoleError).toHaveBeenCalledWith("Profile edit failed:", {
      name: undefined, code: "42501", status: 403,
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toMatch(/09181234567|private|hint/);
    expect(result.current.errorMessage).toBe("Couldn't save your profile. Please try again.");
    expect(result.current.dirty).toBe(true);
    expect(result.current.succeeded).toBe(false);
    consoleError.mockRestore();
  });

  it("prevents repeated saves and photo selection while saving", async () => {
    let finish: (value: unknown) => void = () => {};
    mockSave.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const { result } = setup();
    act(() => result.current.changeMobile("09181234567"));
    let saving: Promise<unknown> = Promise.resolve();
    act(() => { saving = result.current.save(); });
    await waitFor(() => expect(result.current.busy).toBe(true));
    await act(async () => {
      await result.current.save();
      await result.current.pickPhoto("avatar");
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockPick).not.toHaveBeenCalled();
    await act(async () => { finish(profileFixture); await saving; });
    expect(result.current.busy).toBe(false);
  });
});
