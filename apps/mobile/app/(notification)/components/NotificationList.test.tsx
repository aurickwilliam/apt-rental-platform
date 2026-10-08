import { fireEvent, render, screen } from "@testing-library/react-native";

import NotificationList from "./NotificationList";

const mockPush = jest.fn();
const mockToastShow = jest.fn();
const mockMarkAsRead = jest.fn();

let mockRole: "tenant" | "landlord" = "landlord";
let mockNotifications: {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  data: Record<string, unknown>;
}[] = [];

jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("heroui-native", () => ({ useToast: () => ({ toast: { show: mockToastShow } }) }));
jest.mock("@repo/utils", () => ({ getRelativeTime: () => "just now" }));
jest.mock("@/hooks/auth", () => ({
  useCurrentUser: () => ({ data: { id: "user-1", user_id: "auth-1", roles: [mockRole] } }),
}));
jest.mock("@/hooks/notifications", () => ({
  useNotifications: () => ({ notifications: mockNotifications, loading: false, error: null }),
  useNotificationActions: () => ({ markAsRead: mockMarkAsRead }),
}));
jest.mock("@/service/auth/portalPreference", () => ({
  authorizedPortal: (roles: string[]) => roles[0] ?? null,
}));
jest.mock("@/stores/usePortalStore", () => ({
  usePortalStore: (select: (state: { portal: string; authUserId: string }) => unknown) =>
    select({ portal: "landlord", authUserId: "auth-1" }),
}));
jest.mock("@/app/(notification)/components/NotificationCardSkeleton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(notification)/components/NotificationCard", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ title, onPress }: { title: string; onPress: () => void }) =>
      React.createElement(Pressable, { onPress }, React.createElement(Text, null, title)),
  };
});

const notification = (overrides: Partial<(typeof mockNotifications)[number]>) => ({
  id: "n1",
  type: "system",
  title: "Notification",
  message: "message",
  created_at: "2026-10-08T00:00:00.000Z",
  is_read: false,
  data: {},
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRole = "landlord";
});

it("explains with a toast, without navigating, when an admin taps a passport review notification", () => {
  mockNotifications = [
    notification({ title: "New passport document submitted", data: { screen: "passportReview", documentId: "doc-1" } }),
  ];
  render(<NotificationList filter="All" />);

  fireEvent.press(screen.getByText("New passport document submitted"));

  expect(mockMarkAsRead).toHaveBeenCalledWith("n1");
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockToastShow).toHaveBeenCalledWith({
    variant: "default",
    label: "Review on the web",
    description: "Passport documents are reviewed in the admin portal on the web.",
  });
});

it("opens the application when a landlord taps a new-application notification", () => {
  mockNotifications = [
    notification({
      type: "apartment",
      title: "New Application",
      data: { screen: "application", applicationId: "app-1", apartmentId: "apt-1" },
    }),
  ];
  render(<NotificationList filter="All" />);

  fireEvent.press(screen.getByText("New Application"));

  expect(mockPush).toHaveBeenCalledWith("/landlord/tenant-applications/app-1");
  expect(mockToastShow).not.toHaveBeenCalled();
});

it("does nothing visible for a notification with no target", () => {
  mockNotifications = [notification({ title: "Plain", data: {} })];
  render(<NotificationList filter="All" />);

  fireEvent.press(screen.getByText("Plain"));

  expect(mockPush).not.toHaveBeenCalled();
  expect(mockToastShow).not.toHaveBeenCalled();
});
