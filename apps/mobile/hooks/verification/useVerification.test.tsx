import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  getUserVerificationQueryKey,
  useLatestVerification,
  useSubmitVerification,
} from "./useVerification";
import {
  fetchLatestVerification,
  submitVerification,
} from "@/service/verification/verificationService";
import { createMobileQueryClient } from "@/utils/queryClient";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock("@/service/verification/verificationService", () => ({
  fetchLatestVerification: jest.fn(),
  fetchVerificationHistory: jest.fn(),
  submitVerification: jest.fn(),
}));

const mockFetchLatestVerification = jest.mocked(fetchLatestVerification);
const mockSubmitVerification = jest.mocked(submitVerification);

const profileRecord = {
  id: "user-1",
  user_id: "auth-1",
  first_name: "Verified",
  last_name: "User",
  middle_name: null,
  email: "verified@example.test",
  mobile_number: "09171234567",
  avatar_url: null,
  account_status: "pending",
  background_url: null,
  role: "tenant",
  gender: null,
  birth_date: null,
  street_address: null,
  barangay: null,
  city: null,
  province: null,
  postal_code: null,
};

const verificationRow = {
  id: "verification-1",
  user_id: "user-1",
  id_type: "Driver’s License",
  id_front_path: "user-1/verification-1/id-front.jpg",
  id_back_path: "user-1/verification-1/id-back.jpg",
  selfie_path: "user-1/verification-1/selfie.jpg",
  status: "pending",
  rejection_reason: null,
  submitted_at: "2026-09-17T00:00:00.000Z",
  reviewed_at: null,
  reviewed_by: null,
  created_at: "2026-09-17T00:00:00.000Z",
  updated_at: null,
};

function createUserQuery() {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.single.mockResolvedValue({ data: profileRecord, error: null });

  return query;
}

function createWrapper() {
  const client = createMobileQueryClient();

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, QueryWrapper };
}

const submitInput = {
  idType: "Driver’s License",
  idFront: { uri: "file:///front.jpg", width: 1200, height: 800 },
  idBack: { uri: "file:///back.jpg", width: 1200, height: 800 },
  selfie: { uri: "file:///selfie.jpg", width: 1200, height: 800 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null });
  mockFrom.mockImplementation(() => createUserQuery());
  mockFetchLatestVerification.mockResolvedValue(verificationRow);
  mockSubmitVerification.mockResolvedValue(verificationRow);
});

describe("useLatestVerification", () => {
  it("reads the current user's latest verification on a stable identity key", async () => {
    const { client, QueryWrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useLatestVerification(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() =>
      expect(result.current.data).toEqual(verificationRow),
    );

    expect(mockFetchLatestVerification).toHaveBeenCalledWith("user-1");
    expect(
      client.getQueryData(getUserVerificationQueryKey("user-1")),
    ).toEqual(verificationRow);

    unmount();
    client.clear();
  });

  it("surfaces a read error without data", async () => {
    const { client, QueryWrapper } = createWrapper();
    mockFetchLatestVerification.mockRejectedValue(new Error("read boom"));
    const { result, unmount } = renderHook(() => useLatestVerification(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();

    unmount();
    client.clear();
  });
});

describe("useSubmitVerification", () => {
  it("submits and refreshes the verification read after success", async () => {
    const { client, QueryWrapper } = createWrapper();
    const latest = renderHook(() => useLatestVerification(), {
      wrapper: QueryWrapper,
    });
    await waitFor(() =>
      expect(latest.result.current.data).toEqual(verificationRow),
    );
    expect(mockFetchLatestVerification).toHaveBeenCalledTimes(1);

    const submitter = renderHook(() => useSubmitVerification(), {
      wrapper: QueryWrapper,
    });

    let row: unknown;
    await act(async () => {
      row = await submitter.result.current.mutateAsync(submitInput);
    });

    expect(row).toEqual(verificationRow);
    expect(mockSubmitVerification).toHaveBeenCalledWith(submitInput);
    await waitFor(() =>
      expect(mockFetchLatestVerification.mock.calls.length).toBeGreaterThan(1),
    );

    latest.unmount();
    submitter.unmount();
    client.clear();
  });

  it("propagates a duplicate-pending rejection to the caller", async () => {
    const { client, QueryWrapper } = createWrapper();
    mockSubmitVerification.mockRejectedValue(
      new Error("You already have a verification under review."),
    );
    const { result, unmount } = renderHook(() => useSubmitVerification(), {
      wrapper: QueryWrapper,
    });

    let message: string | null = null;
    await act(async () => {
      try {
        await result.current.mutateAsync(submitInput);
      } catch (err) {
        message = err instanceof Error ? err.message : null;
      }
    });

    expect(message).toBe("You already have a verification under review.");

    unmount();
    client.clear();
  });
});
