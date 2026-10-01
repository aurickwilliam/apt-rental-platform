import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useCurrentUser } from "hooks/auth";
import { fetchLatestVerification } from "@/service/verification/verificationService";
import { getCurrentUser } from "@/service/auth/currentUserService";
import { createMobileQueryClient } from "@/utils/queryClient";

import { useLatestVerification } from "./useVerification";
import { useVerificationReviewRealtime } from "./useVerificationReviewRealtime";

const mockUseNotificationRealtime = jest.fn();

jest.mock("hooks/auth", () => ({
  useCurrentUserId: () => "user-1",
  useCurrentUser: jest.requireActual("hooks/auth/useCurrentUser").useCurrentUser,
}));

jest.mock("@/hooks/notifications", () => ({
  useNotificationRealtime: (...args: unknown[]) => mockUseNotificationRealtime(...args),
}));

jest.mock("@/service/verification/verificationService", () => ({
  fetchLatestVerification: jest.fn(),
  fetchVerificationHistory: jest.fn(),
  submitVerification: jest.fn(),
}));

jest.mock("@/service/auth/currentUserService", () => ({
  getCurrentUser: jest.fn(),
}));

const mockFetchLatestVerification = jest.mocked(fetchLatestVerification);
const mockGetCurrentUser = jest.mocked(getCurrentUser);

const profileRecord = {
  id: "user-1",
  user_id: "auth-1",
  first_name: "Pending",
  last_name: "User",
  middle_name: null,
  email: "pending@example.test",
  mobile_number: "09171234567",
  avatar_url: null,
  account_status: "pending",
  background_url: null,
  roles: ["tenant"],
  gender: null,
  birth_date: null,
  street_address: null,
  barangay: null,
  city: null,
  province: null,
  postal_code: null,
  preferences: null,
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

function createWrapper() {
  const client = createMobileQueryClient();

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, QueryWrapper };
}

function verificationNotification() {
  return {
    id: "notification-1",
    user_id: "user-1",
    type: "system",
    title: "Account verification approved",
    message: "Your account is now verified.",
    data: { screen: "verification", verificationId: "verification-1" },
    is_read: false,
    created_at: "2026-10-01T00:00:00.000Z",
    read_at: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchLatestVerification.mockResolvedValue(verificationRow);
  mockGetCurrentUser.mockResolvedValue(profileRecord);
});

describe("useVerificationReviewRealtime", () => {
  it("subscribes on the shared notifications channel for the current user", () => {
    const { QueryWrapper } = createWrapper();
    const { unmount } = renderHook(() => useVerificationReviewRealtime(), {
      wrapper: QueryWrapper,
    });

    expect(mockUseNotificationRealtime).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ onInsert: expect.any(Function) }),
    );

    unmount();
  });

  it("refetches verification and profile when a review notification arrives", async () => {
    const { client, QueryWrapper } = createWrapper();
    const latest = renderHook(() => useLatestVerification(), { wrapper: QueryWrapper });
    const currentUser = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper });
    renderHook(() => useVerificationReviewRealtime(), { wrapper: QueryWrapper });

    await waitFor(() => expect(latest.result.current.data).toEqual(verificationRow));
    await waitFor(() => expect(currentUser.result.current.data).toEqual(profileRecord));
    expect(mockFetchLatestVerification).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);

    const [, callbacks] = mockUseNotificationRealtime.mock.calls[0] as [
      string,
      { onInsert: (row: unknown) => void },
    ];
    callbacks.onInsert(verificationNotification());

    await waitFor(() => expect(mockFetchLatestVerification).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalledTimes(2));

    latest.unmount();
    currentUser.unmount();
    client.clear();
  });

  it("ignores non-verification notifications", async () => {
    const { client, QueryWrapper } = createWrapper();
    const latest = renderHook(() => useLatestVerification(), { wrapper: QueryWrapper });
    renderHook(() => useVerificationReviewRealtime(), { wrapper: QueryWrapper });

    await waitFor(() => expect(latest.result.current.data).toEqual(verificationRow));

    const [, callbacks] = mockUseNotificationRealtime.mock.calls[0] as [
      string,
      { onInsert: (row: unknown) => void },
    ];
    callbacks.onInsert({
      ...verificationNotification(),
      type: "message",
      data: { screen: "chat" },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockFetchLatestVerification).toHaveBeenCalledTimes(1);

    latest.unmount();
    client.clear();
  });
});
