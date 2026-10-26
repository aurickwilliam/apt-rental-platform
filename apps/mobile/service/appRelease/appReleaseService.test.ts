import { Linking } from "react-native";
import { fetchAppRelease, openAppDownload } from "./appReleaseService";

const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn((_table: string) => ({ select: mockSelect }));
jest.mock("@repo/supabase", () => ({ supabase: { from: (table: string) => mockFrom(table) } }));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
jest.mock("expo-constants", () => ({ expoConfig: { version: "1.0.0" } }));

const row = {
  latest_version: "1.2.0",
  min_version: "1.0.0",
  apk_url: "https://github.com/o/r/releases/latest/download/apt.apk",
  release_notes: "Bug fixes",
};

beforeEach(() => { jest.clearAllMocks(); });

describe("fetchAppRelease", () => {
  it("reads the Android row and maps it", async () => {
    mockMaybeSingle.mockResolvedValue({ data: row, error: null });
    await expect(fetchAppRelease()).resolves.toEqual({
      latestVersion: "1.2.0",
      minVersion: "1.0.0",
      apkUrl: row.apk_url,
      releaseNotes: "Bug fixes",
    });
    expect(mockFrom).toHaveBeenCalledWith("app_releases");
    expect(mockEq).toHaveBeenCalledWith("platform", "android");
  });

  it("returns null when nothing is published", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(fetchAppRelease()).resolves.toBeNull();
  });

  it("ignores a row whose link is not https", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { ...row, apk_url: "http://example.com/a.apk" }, error: null });
    await expect(fetchAppRelease()).resolves.toBeNull();
  });

  it("surfaces read errors to the caller", async () => {
    const failure = new Error("network");
    mockMaybeSingle.mockResolvedValue({ data: null, error: failure });
    await expect(fetchAppRelease()).rejects.toBe(failure);
  });
});

describe("openAppDownload", () => {
  it("opens a secure link", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await openAppDownload(row.apk_url);
    expect(open).toHaveBeenCalledWith(row.apk_url);
  });

  it("refuses anything else", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await expect(openAppDownload("intent://x#Intent;end")).rejects.toThrow();
    expect(open).not.toHaveBeenCalled();
  });
});
