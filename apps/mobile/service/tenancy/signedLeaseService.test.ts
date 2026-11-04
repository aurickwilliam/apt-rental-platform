import { acknowledgeSignedLease, signedLeaseOperationGuard, uploadSignedLease, viewSignedLease } from "./signedLeaseService";

const mockSession = jest.fn();
const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockRpc = jest.fn();
const mockRead = jest.fn();
const mockResolve = jest.fn();
const mockBrowser = jest.fn();
const mockArrayBuffer = jest.fn();
let mockSize = 128;
let mockScope = { authUserId: "auth-1", portal: "landlord", loading: false };

jest.mock("@repo/supabase", () => ({ supabase: {
  auth: { getSession: (...args: unknown[]) => mockSession(...args) },
  rpc: (...args: unknown[]) => mockRpc(...args),
  storage: { from: () => ({ upload: (...args: unknown[]) => mockUpload(...args), remove: (...args: unknown[]) => mockRemove(...args) }) },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => mockRead() }) }) }),
} }));
jest.mock("expo-file-system", () => ({ File: class {
  get size() { return mockSize; }
  arrayBuffer() { return mockArrayBuffer(); }
} }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: (...args: unknown[]) => mockBrowser(...args) }));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: { getState: () => mockScope } }));
jest.mock("@/service/media/privateMediaResolver", () => ({ resolvePrivateMediaUrls: (...args: unknown[]) => mockResolve(...args) }));

const asset = { uri: "file:///cache/lease.pdf", name: "lease.pdf", mimeType: "application/pdf", lastModified: 123 };
const newPath = "tenancy/123.pdf";
const input = () => ({ tenancyId: "tenancy", asset, previousPath: "tenancy/old.pdf", isCurrent: signedLeaseOperationGuard() });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(123);
  mockSize = 128;
  mockScope = { authUserId: "auth-1", portal: "landlord", loading: false };
  mockSession.mockResolvedValue({ data: { session: { user: { id: "auth-1" } } }, error: null });
  mockArrayBuffer.mockResolvedValue(new ArrayBuffer(128));
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });
  mockRead.mockResolvedValue({ data: { signed_lease_path: "tenancy/old.pdf" }, error: null });
});
afterEach(() => jest.restoreAllMocks());

it("uploads binary before the RPC, deleting the replaced file only after success", async () => {
  await uploadSignedLease(input());
  expect(mockUpload).toHaveBeenCalledWith(newPath, expect.any(ArrayBuffer), { contentType: "application/pdf" });
  expect(mockRpc).toHaveBeenCalledWith("set_tenancy_signed_lease", { p_tenancy_id: "tenancy", p_path: newPath });
  expect(mockRemove).toHaveBeenCalledWith(["tenancy/old.pdf"]);
  expect(mockUpload.mock.invocationCallOrder[0]).toBeLessThan(mockRpc.mock.invocationCallOrder[0]);
  expect(mockRpc.mock.invocationCallOrder[0]).toBeLessThan(mockRemove.mock.invocationCallOrder[0]);
});

it("does not write or delete anything when upload fails", async () => {
  mockUpload.mockResolvedValue({ error: { message: "offline" } });
  await expect(uploadSignedLease(input())).rejects.toThrow("Could not upload");
  expect(mockRpc).not.toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});

it("validates the actual local size, not a picker-supplied size", async () => {
  mockSize = 11 * 1024 * 1024;
  await expect(uploadSignedLease(input())).rejects.toThrow("10 MB");
  expect(mockUpload).not.toHaveBeenCalled();
});

it("keeps the old contract and surfaces a rejected RPC's message", async () => {
  mockRpc.mockResolvedValue({ error: { message: "The signed lease can only be saved while the tenancy is active." } });
  await expect(uploadSignedLease(input())).rejects.toThrow("while the tenancy is active");
  expect(mockRemove).toHaveBeenCalledWith([newPath]);
  expect(mockRemove).not.toHaveBeenCalledWith(["tenancy/old.pdf"]);
});

it.each(["response", "exception"])("reconciles a lost RPC %s without deleting the saved upload", async (kind) => {
  if (kind === "response") mockRpc.mockResolvedValue({ error: { message: "network" } });
  else mockRpc.mockRejectedValue(new Error("network"));
  mockRead.mockResolvedValue({ data: { signed_lease_path: newPath }, error: null });
  await uploadSignedLease(input());
  expect(mockRemove).toHaveBeenCalledTimes(1);
  expect(mockRemove).toHaveBeenCalledWith(["tenancy/old.pdf"]);
});

it.each([
  { data: null, error: { message: "network" } },
  { data: null, error: null },
])("never deletes either file when reconciliation is unknown", async (read) => {
  mockRpc.mockRejectedValue(new Error("network"));
  mockRead.mockResolvedValue(read);
  await expect(uploadSignedLease(input())).rejects.toThrow("Refresh this property");
  expect(mockRemove).not.toHaveBeenCalled();
});

it("does not fail a saved lease when best-effort cleanup fails", async () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  mockRemove.mockRejectedValue(new Error("network"));
  await expect(uploadSignedLease(input())).resolves.toBeUndefined();
  expect(warning).toHaveBeenCalled();
});

it("retires a pending upload after an account switch", async () => {
  mockUpload.mockImplementation(async () => {
    mockScope = { ...mockScope, authUserId: "auth-2" };
    return { error: null };
  });
  await expect(uploadSignedLease(input())).rejects.toThrow("session has changed");
  expect(mockRpc).not.toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});

it("rejects a different session or tenant portal before uploading", async () => {
  mockSession.mockResolvedValue({ data: { session: { user: { id: "auth-2" } } } });
  await expect(uploadSignedLease(input())).rejects.toThrow("session has changed");
  mockScope = { ...mockScope, portal: "tenant" };
  await expect(uploadSignedLease(input())).rejects.toThrow("session has changed");
  expect(mockUpload).not.toHaveBeenCalled();
});

it("opens a fresh private URL directly, never via a third-party viewer", async () => {
  mockResolve.mockResolvedValue({ urls: { [newPath]: "https://storage.example/short-lived" }, error: null });
  await viewSignedLease(newPath, signedLeaseOperationGuard());
  expect(mockResolve).toHaveBeenCalledWith("signed-leases", [newPath], { forceRefreshPaths: [newPath] });
  expect(mockBrowser).toHaveBeenCalledWith("https://storage.example/short-lived");
});

it("does not open a private URL resolved for a retired account", async () => {
  mockResolve.mockImplementation(async () => {
    mockScope = { ...mockScope, authUserId: "auth-2" };
    return { urls: { [newPath]: "https://storage.example/short-lived" }, error: null };
  });
  await expect(viewSignedLease(newPath, signedLeaseOperationGuard())).rejects.toThrow("session has changed");
  expect(mockBrowser).not.toHaveBeenCalled();
});

it("allows tenants to view through the same private viewer", async () => {
  mockScope = { ...mockScope, portal: "tenant" };
  mockResolve.mockResolvedValue({ urls: { [newPath]: "https://storage.example/private" }, error: null });
  await viewSignedLease(newPath, signedLeaseOperationGuard("tenant"));
  expect(mockBrowser).toHaveBeenCalledWith("https://storage.example/private");
});

it("confirms as the tenant through the existing caller-bound RPC only", async () => {
  mockScope = { ...mockScope, portal: "tenant" };
  await acknowledgeSignedLease("tenancy", signedLeaseOperationGuard("tenant"));
  expect(mockRpc).toHaveBeenCalledWith("acknowledge_signed_lease", { p_tenancy_id: "tenancy" });
  expect(mockUpload).not.toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});

it("never permits landlord confirmation or tenant upload even with an otherwise valid scope guard", async () => {
  await expect(acknowledgeSignedLease("tenancy", signedLeaseOperationGuard())).rejects.toThrow("session has changed");
  mockScope = { ...mockScope, portal: "tenant" };
  await expect(uploadSignedLease({ ...input(), isCurrent: signedLeaseOperationGuard("tenant") })).rejects.toThrow("session has changed");
  expect(mockRpc).not.toHaveBeenCalled();
  expect(mockUpload).not.toHaveBeenCalled();
});

it("surfaces a refused confirmation and rejects late account/portal results", async () => {
  mockScope = { ...mockScope, portal: "tenant" };
  const error = { message: "Only the tenant of this tenancy can confirm the lease." };
  mockRpc.mockResolvedValueOnce({ error });
  await expect(acknowledgeSignedLease("tenancy", signedLeaseOperationGuard("tenant"))).rejects.toEqual(error);
  mockRpc.mockImplementationOnce(async () => {
    mockScope = { ...mockScope, portal: "landlord" };
    return { error: null };
  });
  await expect(acknowledgeSignedLease("tenancy", signedLeaseOperationGuard("tenant"))).rejects.toThrow("session has changed");
});
