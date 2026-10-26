import { Platform } from "react-native";
import { getAuthBrowserOptions } from "./authBrowser";

const mockGetBrowsers = jest.fn();
jest.mock("expo-web-browser", () => ({
  getCustomTabsSupportingBrowsersAsync: () => mockGetBrowsers(),
}));

afterEach(() => { jest.restoreAllMocks(); mockGetBrowsers.mockReset(); });

describe("getAuthBrowserOptions", () => {
  it("leaves iOS on the system browser", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    await expect(getAuthBrowserOptions()).resolves.toEqual({});
    expect(mockGetBrowsers).not.toHaveBeenCalled();
  });

  it("picks Chrome on Android when it supports custom tabs", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetBrowsers.mockResolvedValue({ browserPackages: ["com.sec.android.app.sbrowser", "com.android.chrome"] });
    await expect(getAuthBrowserOptions()).resolves.toEqual({ browserPackage: "com.android.chrome" });
  });

  it("uses the default browser when Chrome is not available", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockGetBrowsers.mockResolvedValue({ browserPackages: ["com.sec.android.app.sbrowser"] });
    await expect(getAuthBrowserOptions()).resolves.toEqual({});
  });

  it("falls back to the default browser if the lookup fails", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockGetBrowsers.mockRejectedValue(new Error("no service"));
    await expect(getAuthBrowserOptions()).resolves.toEqual({});
  });
});
