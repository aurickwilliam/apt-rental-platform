import type { ReactNode } from "react";
import { Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useAppUpdate } from "./useAppUpdate";

const mockFetch = jest.fn();
const mockRead = jest.fn();
const mockSave = jest.fn();
let mockInstalled: string | null = "1.0.0";

jest.mock("@/service/appRelease/appReleaseService", () => ({
  fetchAppRelease: () => mockFetch(),
  getInstalledAppVersion: () => mockInstalled,
  readDismissedUpdate: () => mockRead(),
  saveDismissedUpdate: (version: string) => mockSave(version),
}));

const release = { latestVersion: "1.2.0", minVersion: "1.1.0", apkUrl: "https://github.com/o/r/a.apk", releaseNotes: null };

let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  jest.replaceProperty(Platform, "OS", "android");
  mockInstalled = "1.0.0";
  mockFetch.mockResolvedValue(release);
  mockRead.mockResolvedValue(null);
  mockSave.mockResolvedValue(undefined);
});

it("requires an update below the minimum version", async () => {
  const { result } = renderHook(() => useAppUpdate(), { wrapper });
  await waitFor(() => expect(result.current.release).toEqual(release));
  expect(result.current.isRequired).toBe(true);
});

it("offers, then remembers a dismissal for that version only", async () => {
  mockInstalled = "1.1.0";
  const { result } = renderHook(() => useAppUpdate(), { wrapper });
  await waitFor(() => expect(result.current.isOffered).toBe(true));
  expect(result.current.isRequired).toBe(false);
  act(() => { result.current.dismiss(); });
  expect(result.current.isOffered).toBe(false);
  expect(mockSave).toHaveBeenCalledWith("1.2.0");
});

it("stays hidden for a version dismissed on a previous launch", async () => {
  mockInstalled = "1.1.0";
  mockRead.mockResolvedValue("1.2.0");
  const { result } = renderHook(() => useAppUpdate(), { wrapper });
  await waitFor(() => expect(result.current.release).toEqual(release));
  expect(result.current.isOffered).toBe(false);
});

it("fails open when the check errors", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  mockFetch.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() => useAppUpdate(), { wrapper });
  await waitFor(() => expect(console.warn).toHaveBeenCalled());
  expect(result.current.isRequired).toBe(false);
  expect(result.current.isOffered).toBe(false);
});

afterEach(() => { client.clear(); jest.restoreAllMocks(); });
