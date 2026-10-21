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
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  const Button = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
    <Pressable onPress={onPress}>{children}</Pressable>
  );
  const Label = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
  Button.Label = Label;
  return { Button, useToast: () => ({ toast: { show: mockToastShow } }) };
});
jest.mock("@repo/utils", () => ({
  ...jest.requireActual<typeof import("@repo/utils")>("@repo/utils"),
  getRelativeTime: () => "just now",
}));
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
jest.mock("@/app/(notification)/components/NotificationRowSkeleton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(notification)/components/NotificationIconTile", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#626B73", primary: "#376BF5" } }) }));

const chat = (id: string, overrides: Partial<(typeof mockNotifications)[number]> & { sender?: string } = {}) => {
  const { sender = "peer-1", ...rest } = overrides;
  return notification({
    id,
    type: "message",
    title: sender === "peer-1" ? "Emma Stone" : "Jon Snow",
    message: `message ${id}`,
    data: { screen: "chat", senderId: sender, conversationKey: `chat:none:user-1:${sender}` },
    ...rest,
  });
};

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

beforeAll(() => {
  // Fake only the clock: date sections are relative to "now".
  jest.useFakeTimers({
    now: new Date(2026, 9, 18, 15),
    doNotFake: [
      "setTimeout", "clearTimeout", "setInterval", "clearInterval", "setImmediate",
      "clearImmediate", "nextTick", "queueMicrotask", "requestAnimationFrame", "cancelAnimationFrame",
    ],
  });
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRole = "landlord";
});

it("explains with a toast, without navigating, when an admin taps a passport review notification", () => {
  mockNotifications = [
    notification({ title: "New passport document submitted", data: { screen: "passportReview", documentId: "doc-1" } }),
  ];
  render(<NotificationList filter="all" />);

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
  render(<NotificationList filter="all" />);

  fireEvent.press(screen.getByText("New Application"));

  expect(mockPush).toHaveBeenCalledWith("/landlord/tenant-applications/app-1");
  expect(mockToastShow).not.toHaveBeenCalled();
});

it("does nothing visible for a notification with no target", () => {
  mockNotifications = [notification({ title: "Plain", data: {} })];
  render(<NotificationList filter="all" />);

  fireEvent.press(screen.getByText("Plain"));

  expect(mockPush).not.toHaveBeenCalled();
  expect(mockToastShow).not.toHaveBeenCalled();
});

/** Every text leaf in the rendered tree, in order. */
const renderedTexts = () => {
  const collect = (node: unknown): string[] => {
    if (typeof node === "string") return [node];
    if (Array.isArray(node)) return node.flatMap(collect);
    if (node && typeof node === "object" && "children" in node) {
      return collect((node as { children: unknown }).children);
    }
    return [];
  };
  return collect(screen.toJSON());
};

/** The given titles in on-screen order, ignoring every other text. */
const orderOf = (titles: string[]) => renderedTexts().filter((text) => titles.includes(text));

it("renders a reaction as a sentence with its quoted message preview", () => {
  mockNotifications = [
    notification({
      type: "message",
      title: "Emma Stone",
      message: "Reacted ❤️ to your message",
      data: { screen: "chat", event: "reaction", messagePreview: "See you at 6pm" },
    }),
  ];
  render(<NotificationList filter="all" />);

  expect(screen.getByText("Emma Stone")).toBeTruthy();
  expect(screen.getByText(/reacted ❤️ to your message/)).toBeTruthy();
  expect(screen.getByText("“See you at 6pm”")).toBeTruthy();
});

it("renders no preview line when the payload has no usable preview", () => {
  mockNotifications = [
    notification({
      type: "message",
      title: "Emma Stone",
      message: "Reacted ❤️ to your message",
      data: { screen: "chat", event: "reaction", messagePreview: "   " },
    }),
  ];
  render(<NotificationList filter="all" />);

  expect(screen.queryByText(/“/)).toBeNull();
});

it("shows a lone chat message as sender + action with a quoted preview", () => {
  mockNotifications = [chat("m1", { message: "Hello", created_at: "2026-10-18T10:00:00" })];
  render(<NotificationList filter="all" />);

  expect(screen.getByText("Emma Stone")).toBeTruthy();
  expect(screen.getByText(/sent you a message/)).toBeTruthy();
  expect(screen.getByText("“Hello”")).toBeTruthy();
  expect(screen.getByText("just now")).toBeTruthy();
});

it("keeps non-chat notifications as title plus an unquoted message", () => {
  mockNotifications = [notification({ title: "Payment Received", message: "₱12,000 from Emma", type: "payment" })];
  render(<NotificationList filter="all" />);

  expect(screen.getByText("Payment Received")).toBeTruthy();
  expect(screen.getByText("₱12,000 from Emma")).toBeTruthy();
});

it("groups the feed under Today, Yesterday and dated section headers", () => {
  mockNotifications = [
    notification({ id: "old", title: "Older", created_at: new Date(2026, 9, 10, 9).toISOString() }),
    notification({ id: "y", title: "Yesterday row", created_at: new Date(2026, 9, 17, 12).toISOString() }),
    notification({ id: "t", title: "Today row", created_at: new Date(2026, 9, 18, 9).toISOString() }),
  ];
  render(<NotificationList filter="all" />);

  expect(screen.getAllByRole("header").map((h) => h.props.children)).toEqual(["Today", "Yesterday", "Oct 10"]);
  expect(orderOf(["Today row", "Yesterday row", "Older"])).toEqual(["Today row", "Yesterday row", "Older"]);
});

it("sorts refreshed feed rows newest-first with stable timestamp ties", () => {
  mockNotifications = [
    notification({ id: "older", title: "Older row", created_at: "2026-10-17T12:00:00Z" }),
    notification({ id: "b", title: "Today B", created_at: "2026-10-18T12:00:00Z" }),
    notification({ id: "a", title: "Today A", created_at: "2026-10-18T12:00:00Z" }),
  ];
  const titles = ["New arrival", "Today A", "Today B", "Older row"];
  const { rerender } = render(<NotificationList filter="all" />);
  expect(orderOf(titles)).toEqual(["Today A", "Today B", "Older row"]);

  // The existing Realtime subscription refreshes the query cache with a new array.
  mockNotifications = [...mockNotifications, notification({
    id: "new", title: "New arrival", created_at: "2026-10-18T13:00:00Z",
  })];
  rerender(<NotificationList filter="all" />);
  expect(orderOf(titles)).toEqual(["New arrival", "Today A", "Today B", "Older row"]);

  fireEvent.press(screen.getByText("Today A"));
  expect(mockMarkAsRead).toHaveBeenCalledWith("a");
  mockNotifications = mockNotifications.map(n => ({ ...n, is_read: true }));
  rerender(<NotificationList filter="all" />);
  expect(orderOf(titles)).toEqual(["New arrival", "Today A", "Today B", "Older row"]);
});

it("keeps only unread rows, and whole groups with an unread member, on the Unread tab", () => {
  mockNotifications = [
    notification({ id: "read", title: "Read row", is_read: true }),
    notification({ id: "unread", title: "Unread row", created_at: "2026-10-18T09:00:00" }),
    chat("g1", { created_at: "2026-10-18T10:00:00", is_read: true }),
    chat("g2", { created_at: "2026-10-18T10:05:00" }),
  ];
  render(<NotificationList filter="unread" />);

  expect(screen.queryByText("Read row")).toBeNull();
  expect(screen.getByText("Unread row")).toBeTruthy();
  expect(screen.getByText(/sent you 2 messages/)).toBeTruthy();
});

it("shows an all-caught-up message when nothing is unread", () => {
  mockNotifications = [notification({ is_read: true })];
  render(<NotificationList filter="unread" />);

  expect(screen.getByText("You're all caught up")).toBeTruthy();
});

it("offers a way back to all notifications from the Unread empty state", () => {
  mockNotifications = [notification({ is_read: true })];
  const onShowAll = jest.fn();
  render(<NotificationList filter="unread" onShowAll={onShowAll} />);

  fireEvent.press(screen.getByText("View all notifications"));

  expect(onShowAll).toHaveBeenCalled();
});

it("explains an empty feed instead of leaving blank space", () => {
  mockNotifications = [];
  render(<NotificationList filter="all" />);

  expect(screen.getByText("No notifications yet")).toBeTruthy();
  expect(screen.queryByText("View all notifications")).toBeNull();
});

describe("message groups", () => {
  it("collapses consecutive messages from one sender into a summary with the latest preview", () => {
    mockNotifications = [
      chat("m1", { message: "first", created_at: "2026-10-18T10:00:00" }),
      chat("m2", { message: "second", created_at: "2026-10-18T10:10:00" }),
    ];
    render(<NotificationList filter="all" />);

    expect(screen.getByText(/sent you 2 messages/)).toBeTruthy();
    expect(screen.getByText("Latest: “second”")).toBeTruthy();
    expect(screen.queryByText("“first”")).toBeNull();
  });

  it("does not group messages past the window or from another sender", () => {
    mockNotifications = [
      chat("m1", { created_at: "2026-10-18T09:00:00" }),
      chat("m2", { created_at: "2026-10-18T10:00:00" }),
      chat("m3", { sender: "peer-2", created_at: "2026-10-18T10:05:00" }),
    ];
    render(<NotificationList filter="all" />);

    expect(screen.queryByText(/sent you 2 messages/)).toBeNull();
    expect(screen.getAllByText(/sent you a message/)).toHaveLength(3);
  });

  it("never groups reactions", () => {
    mockNotifications = [
      chat("m1", { created_at: "2026-10-18T10:00:00" }),
      chat("m2", { created_at: "2026-10-18T10:02:00", message: "Reacted ❤️ to your message",
        data: { screen: "chat", event: "reaction", senderId: "peer-1", conversationKey: "chat:none:user-1:peer-1" } }),
    ];
    render(<NotificationList filter="all" />);

    expect(screen.queryByText(/sent you 2 messages/)).toBeNull();
  });

  it("expands in place without navigating or marking anything read", () => {
    mockNotifications = [
      chat("m1", { message: "first", created_at: "2026-10-18T10:00:00" }),
      chat("m2", { message: "second", created_at: "2026-10-18T10:10:00" }),
    ];
    render(<NotificationList filter="all" />);

    fireEvent.press(screen.getByLabelText("Expand messages from Emma Stone"));

    expect(screen.getByText("“second”")).toBeTruthy();
    expect(screen.getByText("“first”")).toBeTruthy();
    expect(screen.queryByText(/^Latest:/)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockMarkAsRead).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Collapse messages from Emma Stone"));
    expect(screen.getByText("Latest: “second”")).toBeTruthy();
  });

  it("opens the conversation and acknowledges the unread members when the summary is tapped", () => {
    mockNotifications = [
      chat("m1", { created_at: "2026-10-18T10:00:00" }),
      chat("m2", { created_at: "2026-10-18T10:05:00", is_read: true }),
      chat("m3", { created_at: "2026-10-18T10:10:00" }),
    ];
    render(<NotificationList filter="all" />);

    fireEvent.press(screen.getByText(/sent you 3 messages/));

    expect(mockMarkAsRead.mock.calls.map(([id]) => id).sort()).toEqual(["m1", "m3"]);
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/chat/[conversationId]" }));
  });

  it("acknowledges nothing when the group has no resolvable conversation", () => {
    const orphan = (id: string, at: string) => notification({
      id, type: "message", title: "Emma Stone", message: id, created_at: at,
      data: { screen: "chat", senderId: "peer-1", conversationKey: "chat:broken" },
    });
    mockNotifications = [orphan("m1", "2026-10-18T10:00:00"), orphan("m2", "2026-10-18T10:05:00")];
    render(<NotificationList filter="all" />);

    fireEvent.press(screen.getByText(/sent you 2 messages/));

    expect(mockMarkAsRead).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens and acknowledges a single expanded member on its own", () => {
    mockNotifications = [
      chat("m1", { message: "first", created_at: "2026-10-18T10:00:00" }),
      chat("m2", { message: "second", created_at: "2026-10-18T10:10:00" }),
    ];
    render(<NotificationList filter="all" />);

    fireEvent.press(screen.getByLabelText("Expand messages from Emma Stone"));
    fireEvent.press(screen.getByText("“first”"));

    expect(mockMarkAsRead).toHaveBeenCalledTimes(1);
    expect(mockMarkAsRead).toHaveBeenCalledWith("m1");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
