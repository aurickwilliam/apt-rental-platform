import { act, renderHook } from "@testing-library/react-native";
import { usePublishApartment } from "./usePublishApartment";
import { useApartmentFormStore } from "@/stores/useApartmentFormStore";
import { OWN_ELECTRICITY_METER_ERROR } from "@repo/constants";

const mockInsert = jest.fn();
const mockFrom = jest.fn();
const mockStorageFrom = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args), storage: { from: (...args: unknown[]) => mockStorageFrom(...args) } },
}));
jest.mock("hooks/auth", () => ({ useProfile: () => ({ profile: { id: "landlord-id" } }) }));
jest.mock("expo-file-system", () => ({ File: jest.fn() }));
jest.mock("@/utils/compressImage", () => ({ buildImageTiers: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue({ insert: mockInsert });
  useApartmentFormStore.getState().reset();
  useApartmentFormStore.getState().setThumbnail({ uri: "file:///photo.jpg", width: 100, height: 100 });
});

it("rejects an unchecked declaration before making a database or storage request", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const { result } = await renderHook(() => usePublishApartment());
    let published: string | null = "not-set";
    await act(async () => { published = await result.current.publish(); });
    expect(published).toBeNull();
    expect(result.current.error).toBe(OWN_ELECTRICITY_METER_ERROR);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockStorageFrom).not.toHaveBeenCalled();
  } finally { log.mockRestore(); }
});

it("sends explicit confirmation and preserves database refusal messages", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    useApartmentFormStore.getState().setField("hasOwnElectricityMeter", true);
    mockInsert.mockReturnValue({ select: () => ({ single: async () => ({ data: null, error: { message: OWN_ELECTRICITY_METER_ERROR } }) }) });
    const { result } = await renderHook(() => usePublishApartment());
    await act(async () => { await result.current.publish(); });
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ has_own_electricity_meter: true, landlord_id: "landlord-id" }));
    expect(result.current.error).toBe(OWN_ELECTRICITY_METER_ERROR);
    expect(mockStorageFrom).not.toHaveBeenCalled();
    expect(useApartmentFormStore.getState().hasOwnElectricityMeter).toBe(true);
  } finally { log.mockRestore(); }
});
