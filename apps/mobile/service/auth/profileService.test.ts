import {
  editableProfileSnapshot,
  pickProfilePhoto,
  saveProfile,
  type EditableProfileFields,
} from "./profileService";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockStorageFrom = jest.fn();
const mockPermissions = jest.fn();
const mockPicker = jest.fn();
const mockCompress = jest.fn();
const mockBytes = jest.fn();
const mockUUID = jest.fn();

jest.mock("@repo/supabase", () => ({ supabase: {
  auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  from: (...args: unknown[]) => mockFrom(...args),
  storage: { from: (...args: unknown[]) => mockStorageFrom(...args) },
} }));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockPermissions(),
  launchImageLibraryAsync: (...args: unknown[]) => mockPicker(...args),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => mockUUID() }));
jest.mock("expo-file-system", () => ({ File: class { bytes() { return mockBytes(); } } }));
jest.mock("@/utils/compressImage", () => ({
  compressImageTo: (...args: unknown[]) => mockCompress(...args),
  PROFILE_AVATAR_MAX_LONG_EDGE: 800,
  PROFILE_BACKGROUND_MAX_LONG_EDGE: 1920,
  PROFILE_QUALITY: 0.8,
}));

const fields: EditableProfileFields = {
  mobile_number: "09171234567", gender: "Male", street_address: "  123 Street  ",
  province: "Metro Manila", city: "Caloocan", barangay: "Barangay 1", postal_code: "1400",
};
const photo = { uri: "file:///photo.jpg", width: 1200, height: 800 };
const saved = { ...fields, postal_code: 1400, avatar_url: "old-avatar", background_url: "old-background" };
const input = { authUserId: "auth-1", fields, photos: { avatar: null, background: null } };

describe("profileService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null });
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: saved, error: null });
    mockStorageFrom.mockReturnValue({ upload: mockUpload, remove: mockRemove, getPublicUrl: mockGetPublicUrl });
    mockPermissions.mockResolvedValue({ status: "granted" });
    mockPicker.mockResolvedValue({ canceled: false, assets: [photo] });
    mockCompress.mockResolvedValue({ uri: "file:///compressed.jpg" });
    mockBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mockUUID.mockReturnValueOnce("photo-1").mockReturnValue("photo-2");
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockImplementation((path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }));
  });

  it.each(["avatar", "background"] as const)("selects a %s locally without uploads or row updates", async (target) => {
    await expect(pickProfilePhoto(target)).resolves.toEqual(photo);
    expect(mockPicker).toHaveBeenCalledWith(expect.objectContaining({
      aspect: target === "avatar" ? [1, 1] : [16, 9], allowsEditing: true, exif: false,
    }));
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCompress).not.toHaveBeenCalled();
  });

  it("leaves the selection unchanged when the picker is cancelled", async () => {
    mockPicker.mockResolvedValueOnce({ canceled: true, assets: null });
    await expect(pickProfilePhoto("avatar")).resolves.toBeNull();
  });

  it("reports denied photo permission without opening the picker", async () => {
    mockPermissions.mockResolvedValueOnce({ status: "denied" });
    await expect(pickProfilePhoto("avatar")).rejects.toThrow("Permission to access photos is required.");
    expect(mockPicker).not.toHaveBeenCalled();
  });

  it("updates only editable fields for the authenticated user's own row", async () => {
    await expect(saveProfile(input)).resolves.toEqual(saved);
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockEq).toHaveBeenCalledWith("user_id", "auth-1");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      ...fields, street_address: "123 Street", postal_code: 1400, updated_at: expect.any(String),
    });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled(); // A zero-row write must not count as success.
  });

  it("compresses/uploads binary photos, then commits their references in one row write", async () => {
    await saveProfile({ ...input, photos: { avatar: photo, background: photo } });
    expect(mockCompress).toHaveBeenNthCalledWith(1, photo.uri, 1200, 800, 800, 0.8);
    expect(mockCompress).toHaveBeenNthCalledWith(2, photo.uri, 1200, 800, 1920, 0.8);
    expect(mockStorageFrom).toHaveBeenCalledWith("avatars");
    expect(mockStorageFrom).toHaveBeenCalledWith("background_photos");
    expect(mockUpload).toHaveBeenNthCalledWith(1, "auth-1/photo-1.jpg", new Uint8Array([1, 2, 3]), {
      contentType: "image/jpeg", upsert: false,
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      avatar_url: "https://cdn.example/auth-1/photo-1.jpg",
      background_url: "https://cdn.example/auth-1/photo-2.jpg",
    }));
    expect(mockUpdate.mock.invocationCallOrder[0]).toBeGreaterThan(mockUpload.mock.invocationCallOrder[1]);
  });

  it.each([null, { id: "different-account" }])("refuses missing or changed authentication (%s)", async (user) => {
    mockGetUser.mockResolvedValueOnce({ data: { user }, error: null });
    await expect(saveProfile(input)).rejects.toThrow("Please sign in again");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("does not update the profile when a photo upload fails, and cleans only uncommitted new files", async () => {
    mockUpload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error("upload failed") });
    await expect(saveProfile({ ...input, photos: { avatar: photo, background: photo } })).rejects.toThrow("upload failed");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith(["auth-1/photo-1.jpg"]);
    expect(mockRemove).not.toHaveBeenCalledWith(["auth-1/auth-1.jpg"]);
  });

  it("keeps uploaded files if a row write has an uncertain outcome", async () => {
    mockSingle.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(saveProfile({ ...input, photos: { avatar: photo, background: null } })).rejects.toThrow("Network request failed");
    expect(mockRemove).not.toHaveBeenCalled();
    expect(mockUpload.mock.calls[0][2].upsert).toBe(false);
  });

  it("surfaces a denied or zero-row update rather than reporting success", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });
    await expect(saveProfile(input)).rejects.toEqual({ code: "PGRST116" });
  });

  it("snapshots missing values safely and retains postal codes as text", () => {
    expect(editableProfileSnapshot({ ...saved, gender: null, mobile_number: null, postal_code: null }))
      .toMatchObject({ gender: "", mobile_number: "", postal_code: "" });
    expect(editableProfileSnapshot(saved).postal_code).toBe("1400");
  });
});
