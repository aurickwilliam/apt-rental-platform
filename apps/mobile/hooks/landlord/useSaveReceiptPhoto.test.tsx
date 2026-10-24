import { renderHook } from "@testing-library/react-native";

import { useSaveReceiptPhoto } from "./useSaveReceiptPhoto";

const mockRequest = jest.fn();
const mockSaveToLibrary = jest.fn();
const mockCapture = jest.fn();

let mockMissing = false;
let mockLoads = 0;
jest.mock("expo-media-library/legacy", () => {
  mockLoads += 1;
  if (mockMissing) throw new Error("Cannot find native module 'ExpoMediaLibraryNext'");
  return {
    requestPermissionsAsync: (...args: unknown[]) => mockRequest(...args),
    saveToLibraryAsync: (...args: unknown[]) => mockSaveToLibrary(...args),
  };
});
jest.mock("react-native-view-shot", () => {
  mockLoads += 1;
  return { captureRef: (...args: unknown[]) => mockCapture(...args) };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRequest.mockResolvedValue({ granted: true });
  mockCapture.mockResolvedValue("file:///tmp/receipt.png");
  mockSaveToLibrary.mockResolvedValue(undefined);
});

const mounted = () => {
  const hook = renderHook(() => useSaveReceiptPhoto());
  (hook.result.current.receiptRef as { current: unknown }).current = { view: true };
  return hook;
};

describe("useSaveReceiptPhoto", () => {
  // These two run first: a module that loads is cached, one that throws is retried.
  it("does not load the native modules just by being imported or rendered", () => {
    mounted();
    expect(mockLoads).toBe(0);
  });

  it("answers unavailable, rather than throwing, when a native module is missing from this build", async () => {
    mockMissing = true;
    const { result } = mounted();
    await expect(result.current.save()).resolves.toBe("unavailable");
    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockSaveToLibrary).not.toHaveBeenCalled();
    mockMissing = false;
  });

  it("asks for add-only access, captures the receipt as a PNG file and adds it to the library", async () => {
    const { result } = mounted();
    await expect(result.current.save()).resolves.toBe("saved");
    expect(mockRequest).toHaveBeenCalledWith(true);
    expect(mockCapture).toHaveBeenCalledWith(result.current.receiptRef, { format: "png", quality: 1, result: "tmpfile" });
    expect(mockSaveToLibrary).toHaveBeenCalledWith("file:///tmp/receipt.png");
  });

  it("captures and saves nothing when access is refused", async () => {
    mockRequest.mockResolvedValue({ granted: false });
    const { result } = mounted();
    await expect(result.current.save()).resolves.toBe("denied");
    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockSaveToLibrary).not.toHaveBeenCalled();
  });

  it("fails loudly when the receipt is not on screen", async () => {
    const { result } = renderHook(() => useSaveReceiptPhoto());
    await expect(result.current.save()).rejects.toThrow("not on screen");
    expect(mockSaveToLibrary).not.toHaveBeenCalled();
  });

  it("does not report a save when the capture or the library write fails", async () => {
    mockCapture.mockRejectedValueOnce(new Error("capture failed"));
    const first = mounted();
    await expect(first.result.current.save()).rejects.toThrow("capture failed");
    expect(mockSaveToLibrary).not.toHaveBeenCalled();

    mockSaveToLibrary.mockRejectedValueOnce(new Error("write failed"));
    const second = mounted();
    await expect(second.result.current.save()).rejects.toThrow("write failed");
  });
});
