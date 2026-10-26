import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import {
  groupNotificationsByLocalDate,
  sortNotificationsNewestFirst,
} from "../../../packages/utils/src/notificationOrder.ts";
import * as audience from "./notification-audience.ts";
import * as conversationContacts from "./conversation-contacts.ts";
import { EMPTY_NOTIFICATION_FEED, NotificationFeedStore } from "./notification-feed-store.ts";

// Exercise the real hook's subscription callback and the real drawer's render
// tree, with only React/platform/network boundaries replaced (no DB access).
function createFeed({ recipientId = "viewer", ownershipRecords = null } = {}) {
  const row = (id, day, hour, is_read = false) => ({
    id, title: id, message: id, type: "system", data: {}, user_id: recipientId,
    created_at: new Date(2026, 9, day, hour).toISOString(), is_read,
  });
  const chat = (id, { hour, minute = 0, day = 18, is_read = false, sender = "peer-1", apartment = "apt-1", recipientPortal = "tenant" } = {}) => ({
    id, title: "MAHARTT Navales", message: `message ${id}`, type: "message", user_id: recipientId,
    data: {
      screen: "chat", senderId: sender, apartmentId: apartment, recipientPortal,
      conversationKey: `chat:${apartment ?? "none"}:${sender}:viewer`,
    },
    created_at: new Date(2026, 9, day, hour, minute).toISOString(), is_read,
  });
  let serverRows = [row("yesterday", 17, 12), row("morning", 18, 8)];
  let stateSlots = [];
  let stateCursor = 0;
  let activePortal = "tenant";
  let stateChanged = false;
  let onRealtime;
  let store;
  let linkOverride = null;
  let drawerSide = "right";
  const calls = { loads: 0, connections: 0, writes: [], pushes: [], closes: 0, groupInputs: [] };
  const captureStore = value => { store = value; };
  const subscriptions = new Map();
  class TestStore extends NotificationFeedStore {
    constructor(dependencies) { super(dependencies); captureStore(this); }
  }
  const channel = {
    on: (_event, options, callback) => {
      assert.equal(options.table, "notifications");
      assert.equal(options.event, "*");
      onRealtime = callback;
      return channel;
    },
    subscribe: () => { calls.connections++; return channel; },
  };
  const react = {
    useCallback: fn => fn,
    useMemo: fn => fn(),
    // Stateful across renders so expansion (and the filter) behave like the
    // real component; the cursor resets on every render, like React's order.
    useState: initial => {
      const index = stateCursor++;
      if (!(index in stateSlots)) {
        stateSlots[index] = typeof initial === "function" ? initial() : initial;
      }
      const setter = next => {
        stateSlots[index] = typeof next === "function" ? next(stateSlots[index]) : next;
        stateChanged = true;
      };
      return [stateSlots[index], setter];
    },
    useSyncExternalStore: (subscribe, snapshot) => {
      if (snapshot.name === "getLocalCalendarDay") return new Date(2026, 9, 18).getTime();
      if (snapshot.name === "readHasCustomPlacement") return false;
      if (!subscriptions.has(subscribe)) subscriptions.set(subscribe, subscribe(() => {}));
      return snapshot();
    },
  };
  const load = (file, modules) => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, require: name => {
      assert.ok(name in modules, `Missing test dependency: ${name}`);
      return modules[name];
    } });
    return exports;
  };
  const notificationGroups = load("../../../packages/utils/src/notificationGroups.ts", {
    "./notificationOrder": { sortNotificationsNewestFirst },
  });
  const chatAudience = load("./chat-notification-audience.ts", { "./notification-audience": audience });
  const resolvedRows = () => ownershipRecords === null ? serverRows
    : chatAudience.resolveChatNotificationAudiences(serverRows, recipientId, ownershipRecords);
  const links = load("./notification-links.ts", {
    "./conversation-contacts": conversationContacts,
  });
  const drawerLinks = {
    ...links,
    resolveNotificationTarget: (data, portal) => linkOverride
      ? linkOverride(data, portal)
      : links.resolveNotificationTarget(data, portal),
  };
  const hook = load("../hooks/use-notifications.ts", {
    react,
    "@repo/supabase/browser": { createClient: () => ({ channel: () => channel, removeChannel: () => {} }) },
    "@/hooks/use-user": { useUser: () => ({ user: { id: "auth-viewer" }, profile: { id: recipientId }, loading: false }) },
    "@/lib/notification-feed-store": { EMPTY_NOTIFICATION_FEED, NotificationFeedStore: TestStore },
    "@/service/notificationService": {
      fetchNotifications: async () => { calls.loads++; return resolvedRows(); },
      markNotificationRead: async id => { calls.writes.push([id]); },
      markNotificationsRead: async ids => { calls.writes.push([...ids]); },
    },
    "@/lib/notification-audience": audience,
  });
  const jsx = (type, props) => ({ type, props });
  const compound = new Proxy({}, { get: (_, key) => `Drawer.${String(key)}` });
  const drawer = load("../app/components/notifications/NotificationDrawer.tsx", {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { useRouter: () => ({ push: href => { calls.pushes.push(href); } }) },
    "@heroui/react": { Button: "Button", Drawer: compound, Skeleton: "Skeleton", useOverlayState: state => state },
    "@tabler/icons-react": { IconBell: "IconBell", IconX: "IconX" },
    "@repo/utils": {
      groupNotificationsByLocalDate,
      groupNotificationFeed: notifications => {
        calls.groupInputs.push([...notifications.map(notification => notification.id)]);
        return notificationGroups.groupNotificationFeed(notifications);
      },
    },
    "@/hooks/use-notifications": hook,
    "@/hooks/use-notification-display-preferences": { useNotificationDisplayPreferences: () => ({ preferences: { entry: "bell", drawerSide }, update: () => {} }) },
    "@/lib/notification-fab-position": {},
    "@/lib/notification-calendar": { getLocalCalendarDay: function getLocalCalendarDay() {}, subscribeLocalCalendarDay: () => {} },
    "@/lib/notification-links": drawerLinks,
    "./DraggableNotificationBell": { FAB_PLACEMENT_RESET_EVENT: "unused" },
    "./NotificationGroupRow": { default: "NotificationGroupRow" },
    "./NotificationRow": { default: "NotificationRow" },
  }).default;
  const groupRow = load("../app/components/notifications/NotificationGroupRow.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button" },
    "@tabler/icons-react": { IconChevronDown: "IconChevronDown", IconMessageCircle: "IconMessageCircle" },
    "@repo/utils": { ...notificationGroups, getRelativeTime: () => "Just now" },
    "./NotificationRow": { default: "NotificationRow" },
  }).default;
  const nodes = element => {
    if (!element || typeof element !== "object") return [];
    return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
  };
  const strings = element => {
    if (typeof element === "string") return [element];
    if (!element || typeof element !== "object") return [];
    return [element.props?.children].flat(Infinity).flatMap(strings);
  };
  const render = () => {
    let tree;
    let renders = 0;
    do {
      stateCursor = 0;
      stateChanged = false;
      tree = drawer({ activePortal, open: true, onClose: () => { calls.closes++; } });
      assert.ok(++renders < 10, "render-time prop adjustment must settle");
    } while (stateChanged);
    const all = nodes(tree);
    return {
      sections: all.filter(n => n.type === "section").map(n => ({
        label: n.props["aria-label"],
        rows: nodes(n).filter(n => n.type === "NotificationRow").map(n => n.props.notification.id),
      })),
      // Groups render as one summary each; their members live inside the real
      // component, so the drawer tree only carries the unit and handlers.
      groups: all.filter(n => n.type === "NotificationGroupRow").map(n => ({
        key: n.props.unit.key,
        count: n.props.unit.count,
        latest: n.props.unit.latest.id,
        members: [...n.props.unit.members.map(member => member.id)],
        expanded: n.props.expanded,
        node: n,
      })),
      all,
    };
  };
  return {
    row, chat, render, calls, nodes,
    elements: nodes,
    strings,
    // The real component with default handlers, so tests can override one.
    groupRow: props => groupRow({ onToggle: () => {}, onOpenGroup: () => {}, onOpenMember: () => {}, ...props }),
    consumer: portal => hook.useNotifications(portal),
    start: async () => {
      render();
      await store.refresh();
    },
    receive: async rows => {
      serverRows = rows;
      onRealtime();
      await store.refresh();
      assert.deepEqual(store.getSnapshot().notifications, resolvedRows(), "Realtime must refresh the resolved feed data");
    },
    stop: () => subscriptions.forEach(dispose => dispose()),
    setFilter: value => {
      const index = stateSlots.findIndex(slot => slot === "all" || slot === "unread");
      assert.ok(index >= 0, "drawer filter state must exist");
      stateSlots[index] = value;
    },
    setLinkOverride: resolve => { linkOverride = resolve; },
    setPortal: portal => { activePortal = portal; },
    setDrawerSide: side => { drawerSide = side; },
    getRows: () => serverRows,
  };
}

test("legacy apartment roles filter before grouping, counters and mark-all across Realtime and portals", async () => {
  const recipientId = "39d239dc-3df7-4be7-a534-f127310e1c3b";
  const peer = "fffe3a40-7fa6-4079-81c8-28d1301b8814";
  const owned = "81ad4faf-b38d-4e29-b5d8-5e63df8b9b8a";
  const rented = "dfddbfce-8611-403b-aefe-ac6e770b8f35";
  const feed = createFeed({ recipientId, ownershipRecords: [
    { id: owned, landlord_id: recipientId }, { id: rented, landlord_id: peer },
  ] });
  const legacy = (id, apartmentId, minute = 0, extra = {}) => ({
    ...feed.chat(id, { hour: 12, minute }),
    data: { screen: "chat", apartmentId, senderId: peer,
      conversationKey: `chat:${apartmentId}:${peer}:${recipientId}`, ...extra },
  });
  try {
    await feed.start();
    const rows = [legacy("landlord-a", owned), legacy("landlord-b", owned, 2),
      legacy("tenant-image", rented, 3), legacy("tenant-b", rented, 4),
      { ...legacy("sire", owned, 5, { event: "reaction", messagePreview: "sire", emoji: "😂" }), message: "Reacted 😂 to your message" },
      legacy("unresolved", null, 6)];
    await feed.receive(rows);
    let view = feed.render();
    assert.deepEqual(view.groups[0].members, ["tenant-b", "tenant-image"]);
    assert.deepEqual(feed.calls.groupInputs.at(-1), ["tenant-image", "tenant-b"]);
    assert.equal(feed.consumer("tenant").unreadCount, 2);
    assert.equal(feed.consumer("landlord").unreadCount, 3);
    assert.equal(feed.consumer("admin").unreadCount, 0);
    view.groups[0].node.props.onToggle();
    feed.setPortal("landlord");
    view = feed.render();
    assert.deepEqual(view.groups[0].members, ["landlord-b", "landlord-a"]);
    assert.equal(view.groups[0].expanded, false);
    assert.deepEqual(view.sections, [{ label: "Today", rows: ["sire"] }]);
    assert.equal(feed.calls.loads, 2, "portal changes use the same loaded ownership resolution");
    assert.equal(feed.calls.connections, 1);
    assert.deepEqual(feed.calls.writes, []);

    await feed.receive([...rows, legacy("landlord-live", owned, 7)]);
    assert.equal(feed.render().groups[0].count, 3);
    assert.equal(feed.consumer("tenant").unreadCount, 2);
    assert.equal(feed.consumer("landlord").unreadCount, 4);
    await feed.consumer("landlord").markVisibleRead();
    assert.deepEqual(feed.calls.writes, [["landlord-a", "landlord-b", "sire", "landlord-live"]]);
    assert.equal(feed.consumer("landlord").unreadCount, 0);
    feed.setFilter("unread");
    assert.equal(feed.render().groups.length, 0);
    feed.setPortal("tenant");
    assert.equal(feed.render().groups[0].count, 2);
    assert.equal(feed.consumer("tenant").unreadCount, 2);
    assert.equal(feed.getRows().find(n => n.id === "unresolved").is_read, false);
  } finally { feed.stop(); }
});

test("Admin filters before grouping and counting across Realtime and three-role portal switches", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    const review = {
      ...feed.row("review", 17, 10),
      title: "New account verification submitted",
      data: { screen: "verification", verificationId: "verification-1" },
    };
    const chatRows = [feed.chat("first", { hour: 12 }), feed.chat("second", { hour: 12, minute: 5 })];
    const reaction = {
      ...feed.chat("reaction", { hour: 13 }),
      data: { screen: "chat", event: "reaction", messagePreview: "hi sir", recipientPortal: "tenant" },
    };
    await feed.receive([...chatRows, reaction, review]);
    const tenantGroup = feed.render().groups[0];
    tenantGroup.node.props.onToggle();
    assert.equal(feed.render().groups[0].expanded, true);
    feed.setFilter("unread");

    const loads = feed.calls.loads;
    feed.setPortal("admin");
    const admin = feed.render();
    assert.equal(admin.groups.length, 0, "neither grouped nor individual messages reach Admin");
    assert.deepEqual(admin.sections, [{ label: "Yesterday", rows: ["review"] }]);
    assert.deepEqual(feed.calls.groupInputs.at(-1), ["review"], "audience filtering precedes grouping and date sections");
    assert.equal(feed.consumer("admin").unreadCount, 1, "the bell and drawer share this scoped hook count");
    const badge = admin.all.find(node => node.type === "span" && node.props.className?.includes("min-h-5"));
    assert.equal(badge.props.children, 1);
    assert.equal(feed.consumer("tenant").unreadCount, 3);
    assert.equal(feed.consumer("landlord").unreadCount, 0);
    assert.equal(feed.calls.loads, loads, "switching never fetches another feed");
    assert.equal(feed.calls.connections, 1);
    assert.deepEqual(feed.calls.writes, [], "switching is not an acknowledgment");

    const arrived = feed.chat("arrived", { hour: 12, minute: 10 });
    await feed.receive([...chatRows, reaction, review, arrived]);
    assert.equal(feed.render().groups.length, 0);
    assert.deepEqual(feed.calls.groupInputs.at(-1), ["review"]);
    assert.equal(feed.consumer("admin").unreadCount, 1);
    assert.equal(feed.consumer("tenant").unreadCount, 4);

    feed.setPortal("landlord");
    const landlord = feed.render();
    assert.equal(landlord.groups.length, 0, "Tenant chat never carries into Landlord");
    assert.deepEqual(landlord.sections, []);
    feed.setPortal("tenant");
    assert.equal(feed.render().groups[0].expanded, false);

    feed.setPortal("admin");
    feed.render();
    feed.setFilter("unread");
    await feed.consumer("admin").markVisibleRead();
    assert.deepEqual(feed.calls.writes, [["review"]], "Admin mark-all never acknowledges consumer activity");
    assert.equal(feed.render().sections.length, 0);
    feed.setFilter("all");
    assert.deepEqual(feed.render().sections, [{ label: "Yesterday", rows: ["review"] }]);
    assert.equal(feed.consumer("tenant").unreadCount, 4);
    assert.equal(feed.calls.connections, 1);
  } finally { feed.stop(); }
});

test("drawer puts Today first and repositions new Realtime rows without a manual refresh", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    assert.deepEqual(feed.render().sections, [
      { label: "Today", rows: ["morning"] }, { label: "Yesterday", rows: ["yesterday"] },
    ]);
    await feed.receive([...feed.getRows(), feed.row("newest", 18, 13), feed.row("delayed", 18, 9)]);
    assert.deepEqual(feed.render().sections, [
      { label: "Today", rows: ["newest", "delayed", "morning"] },
      { label: "Yesterday", rows: ["yesterday"] },
    ]);
  } finally { feed.stop(); }
});

test("drawer's optimistic mark-read and subsequent Realtime update retain All ordering", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    const before = feed.render();
    const first = before.all.find(n => n.type === "NotificationRow");
    first.props.onOpen();
    assert.deepEqual(feed.render().sections, before.sections);
    feed.setFilter("unread");
    assert.deepEqual(feed.render().sections, [{ label: "Yesterday", rows: ["yesterday"] }]);
    await feed.receive(feed.getRows().map(n => ({ ...n, is_read: n.id === "morning" })));
    assert.deepEqual(feed.render().sections, [{ label: "Yesterday", rows: ["yesterday"] }]);
    feed.setFilter("all");
    assert.deepEqual(feed.render().sections, before.sections);
  } finally { feed.stop(); }
});

test("web feed query uses created_at DESC then id ASC before its limit", async () => {
  const calls = [];
  const query = {
    select: () => query,
    eq: () => query,
    order: (column, options) => { calls.push([column, options.ascending]); return query; },
    limit: async limit => { calls.push(["limit", limit]); return { data: [], error: null }; },
  };
  const source = readFileSync(new URL("../service/notificationService.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: name => {
      if (name === "@/lib/chat-notification-audience") return {
        getLegacyChatApartmentIds: () => [], resolveChatNotificationAudiences: rows => rows,
      };
      assert.equal(name, "@repo/supabase/browser");
      return { createClient: () => ({ from: () => query }) };
    },
  });
  await exports.fetchNotifications("viewer");
  assert.deepEqual(calls, [["created_at", false], ["id", true], ["limit", 50]]);
});

test("real hook consumers share the initial request, Realtime channel and optimistic read snapshot", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    assert.equal(feed.consumer("tenant").unreadCount, 2);
    assert.equal(feed.consumer("landlord").unreadCount, 2);
    assert.equal(feed.consumer("admin").unreadCount, 0);
    assert.equal(feed.calls.loads, 1);
    assert.equal(feed.calls.connections, 1);
    await feed.consumer("tenant").markOneRead("morning");
    assert.equal(feed.consumer("tenant").unreadCount, 1);
    assert.equal(feed.consumer("landlord").unreadCount, 1);
    assert.equal(feed.calls.loads, 1, "successful acknowledgments wait for Realtime, not extra fetches");
    assert.deepEqual(feed.calls.writes, [["morning"]]);
    assert.deepEqual(feed.render().sections, [
      { label: "Today", rows: ["morning"] }, { label: "Yesterday", rows: ["yesterday"] },
    ]);
  } finally { feed.stop(); }
});

test("shared mark-all-read still acknowledges only unread rows in the current portal", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    await feed.receive([
      { ...feed.row("tenant", 18, 10), type: "payment", title: "Payment Successful", data: { screen: "payments" } },
      { ...feed.row("landlord", 18, 9), type: "payment", title: "Payment Received", data: { screen: "payments" } },
    ]);
    await feed.consumer("tenant").markVisibleRead();
    assert.deepEqual(feed.calls.writes, [["tenant"]]);
    assert.equal(feed.consumer("tenant").unreadCount, 0);
    assert.equal(feed.consumer("landlord").unreadCount, 1);
  } finally { feed.stop(); }
});

test("drawer collapses a chat burst into one summary row and leaves other rows individual", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    await feed.receive([
      feed.chat("chat-3", { hour: 13, minute: 5 }),
      feed.chat("chat-2", { hour: 12, minute: 55 }),
      feed.chat("chat-1", { hour: 12, minute: 50 }),
      { ...feed.row("payment", 18, 12), type: "payment", title: "Payment Successful", data: { screen: "payments" } },
    ]);
    const { groups, sections } = feed.render();
    assert.equal(groups.length, 1, "one burst renders one summary");
    assert.equal(groups[0].count, 3);
    assert.equal(groups[0].latest, "chat-3", "the summary previews the newest message");
    assert.deepEqual(groups[0].members, ["chat-3", "chat-2", "chat-1"]);
    assert.equal(groups[0].expanded, false, "groups start collapsed");
    assert.deepEqual(sections, [{ label: "Today", rows: ["payment"] }]);
  } finally { feed.stop(); }
});

test("one chat message renders a normal row with single acknowledgment and navigation", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    const notification = feed.chat("only", { hour: 12 });
    await feed.receive([notification]);
    const view = feed.render();
    assert.equal(view.groups.length, 0, "no summary, chevron or expandable member list");
    const single = view.all.find(node => node.type === "NotificationRow");
    assert.equal(single.props.notification, notification, "the normal row receives all original display fields");
    assert.equal(feed.consumer("tenant").unreadCount, 1);
    single.props.onOpen();
    assert.deepEqual(feed.calls.writes, [["only"]]);
    assert.deepEqual(feed.calls.pushes, ["/tenant/messages?conversation=peer-1:apt-1"]);
    assert.equal(feed.consumer("tenant").unreadCount, 0);
    feed.setFilter("unread");
    assert.equal(feed.render().sections.length, 0);
  } finally { feed.stop(); }
});

test("realtime promotes a single to an expandable group and feed shrink restores a normal row", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    const older = feed.chat("older", { hour: 12, minute: 50 });
    const newer = feed.chat("newer", { hour: 12, minute: 55 });
    await feed.receive([older]);
    assert.equal(feed.render().groups.length, 0);
    await feed.receive([older, newer]);
    const group = feed.render().groups[0];
    assert.equal(group.count, 2);
    assert.deepEqual(group.members, ["newer", "older"]);
    group.node.props.onToggle();
    assert.equal(feed.render().groups[0].expanded, true);
    await feed.receive([newer]);
    feed.setFilter("unread");
    assert.equal(feed.render().groups.length, 0);
    assert.deepEqual(feed.render().sections, [{ label: "Today", rows: ["newer"] }]);
    assert.deepEqual(feed.calls.writes, []);
    assert.deepEqual(feed.calls.pushes, []);
  } finally { feed.stop(); }
});

test("expanding a group is presentation-only and survives realtime arrivals", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    const burst = [feed.chat("chat-2", { hour: 12, minute: 55 }), feed.chat("chat-1", { hour: 12, minute: 50 })];
    await feed.receive(burst);
    const before = feed.render().groups[0];
    assert.equal(before.expanded, false);

    before.node.props.onToggle();
    const expanded = feed.render().groups[0];
    assert.equal(expanded.expanded, true);
    assert.equal(expanded.key, before.key, "the expansion key is the group identity");
    assert.deepEqual(feed.calls.writes, [], "expanding never acknowledges");
    assert.deepEqual(feed.calls.pushes, [], "expanding never navigates");
    assert.equal(feed.calls.closes, 0, "expanding never closes the drawer");

    await feed.receive([feed.chat("chat-3", { hour: 13, minute: 5 }), ...burst]);
    const after = feed.render().groups[0];
    assert.equal(after.expanded, true, "the open group stays open across the arrival");
    assert.equal(after.count, 3, "the arrival joins the same group");
    assert.equal(after.key, before.key);
  } finally { feed.stop(); }
});

test("opening a group acknowledges only its unread rows in one batch and follows the conversation link", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    await feed.receive([
      feed.chat("chat-3", { hour: 13, minute: 5 }),
      feed.chat("chat-2", { hour: 12, minute: 55, is_read: true }),
      feed.chat("chat-1", { hour: 12, minute: 50 }),
    ]);
    feed.render().groups[0].node.props.onOpenGroup();
    assert.deepEqual(feed.calls.writes, [["chat-3", "chat-1"]], "one batch, unread members only");
    assert.deepEqual(feed.calls.pushes, ["/tenant/messages?conversation=peer-1:apt-1"]);
    assert.equal(feed.calls.closes, 1);
    assert.equal(feed.consumer("tenant").unreadCount, 0, "optimistic acknowledgment clears the count");
  } finally { feed.stop(); }
});

test("the unread filter shows a partially unread group until its records are read", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    await feed.receive([
      feed.chat("chat-read", { hour: 12, minute: 50, is_read: true }),
      feed.chat("chat-unread", { hour: 12, minute: 55 }),
    ]);
    feed.setFilter("unread");
    const groups = feed.render().groups;
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].members, ["chat-unread", "chat-read"], "the whole group is in scope");
    assert.deepEqual(feed.render().sections, [{ label: "Today", rows: [] }], "the group is a unit, not a singleton row");

    groups[0].node.props.onOpenGroup();
    assert.equal(feed.render().groups.length, 0, "the acknowledged group leaves the unread tab");
    assert.equal(feed.consumer("tenant").unreadCount, 0);
  } finally { feed.stop(); }
});

test("the inbox fallback navigates without acknowledging the group", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    await feed.receive([feed.chat("chat-2", { hour: 12, minute: 55 }), feed.chat("chat-1", { hour: 12, minute: 50 })]);
    feed.setLinkOverride(() => ({ href: "/tenant/messages", conversationTargeted: false }));
    feed.render().groups[0].node.props.onOpenGroup();
    assert.deepEqual(feed.calls.writes, [], "a fallback destination must not clear rows the user never saw");
    assert.deepEqual(feed.calls.pushes, ["/tenant/messages"]);
    assert.equal(feed.consumer("tenant").unreadCount, 2);
  } finally { feed.stop(); }
});

test("the group row renders a compact summary, expands in place, and keeps controls separate", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    await feed.receive([
      feed.chat("chat-3", { hour: 13, minute: 5 }),
      feed.chat("chat-2", { hour: 12, minute: 55 }),
      feed.chat("chat-1", { hour: 12, minute: 50 }),
    ]);
    const unit = feed.render().groups[0].node.props.unit;

    let toggles = 0;
    let opens = 0;
    const collapsedElement = feed.groupRow({
      unit,
      expanded: false,
      onToggle: () => { toggles++; },
      onOpenGroup: () => { opens++; },
    });
    const collapsed = feed.elements(collapsedElement);
    const summary = collapsed.find(n => n.type === "Button" && n.props.className?.includes("button--bare"));
    const chevron = collapsed.find(n => n.type === "Button" && !n.props.className?.includes("button--bare"));
    const disclosureVisual = collapsed.find(n => n.type === "span" && n.props?.className === "notification-group-disclosure-visual");
    assert.ok(disclosureVisual, "the chevron paints inside a smaller visual surface");
    assert.ok(feed.nodes(disclosureVisual).some(n => n.type === "IconChevronDown"));
    assert.ok(!feed.nodes(chevron).some(n => n.props?.className?.includes("size-1.5")),
      "the unread dot stays outside the 44px disclosure target");
    assert.ok(collapsed.some(n => n.type === "span"
      && n.props?.className?.includes("size-1.5")
      && n.props?.className?.includes("bg-primary")), "the summary keeps its unread dot");
    assert.equal(
      summary.props["aria-label"],
      "MAHARTT Navales, Sent you 3 messages, Latest: message chat-3, unread, Just now",
      "the summary spells out sender, count, preview and unread state",
    );
    assert.equal(summary.type, "Button", "the summary is a HeroUI keyboard control");
    assert.equal(chevron.props["aria-expanded"], false);
    assert.equal(chevron.props["aria-controls"], "notification-group-members-chat-1");
    assert.ok(chevron.props["aria-label"], "the icon-only chevron needs an accessible name");

    const texts = feed.strings(collapsedElement);
    assert.ok(texts.includes("MAHARTT Navales"));
    assert.ok(texts.includes("sent you 3 messages"));
    assert.ok(texts.includes('Latest: “message chat-3”'));
    assert.ok(texts.includes("Just now"));
    assert.equal(collapsed.find(n => n.type === "ul"), undefined, "collapsed shows no member list");

    chevron.props.onPress();
    assert.equal(opens, 0, "the chevron must not navigate");
    assert.equal(toggles, 1);
    summary.props.onClick();
    assert.equal(opens, 1, "only the summary opens the conversation");

    let openedMember = null;
    const expanded = feed.elements(feed.groupRow({ unit, expanded: true, onOpenMember: member => { openedMember = member.id; } }));
    assert.deepEqual(
      expanded.filter(n => n.type === "NotificationRow").map(n => n.props.notification.id),
      ["chat-3", "chat-2", "chat-1"],
      "members render newest first",
    );
    assert.equal(expanded.find(n => n.type === "ul").props.id, "notification-group-members-chat-1");
    assert.equal(expanded.find(n => n.type === "Button" && !n.props.className?.includes("button--bare")).props["aria-expanded"], true);
    assert.equal(
      expanded.find(n => n.type === "Button" && n.props.className?.includes("button--bare")).props["aria-label"],
      "MAHARTT Navales, Sent you 3 messages, unread, Just now",
      "expanded summary drops the duplicated latest preview",
    );
    assert.ok(!feed.strings(expanded[0]).some(text => text.startsWith("Latest:")), "expanded summary hides the preview");
    assert.ok(expanded.filter(n => n.type === "NotificationRow").every(n => n.props.compact === true));
    assert.ok(expanded.some(n => n.type === "span"
      && n.props.children === unit.latest.title
      && n.props.className.includes("truncate")), "long sender names leave room for the group count even when expanded");
    assert.doesNotMatch(expanded.find(n => n.type === "ul").props.className, /border|rail/);
    expanded.find(n => n.type === "NotificationRow").props.onOpen();
    assert.equal(openedMember, "chat-3", "compact children still open their own notification");
  } finally { feed.stop(); }
});

test("drawer opens from the right by default and from the left when Settings says so", async () => {
  const feed = createFeed();
  try {
    await feed.start();
    const content = view => view.all.find(node => node.type === "Drawer.Content");
    const dialog = view => view.all.find(node => node.type === "Drawer.Dialog");
    let view = feed.render();
    assert.equal(content(view).props.placement, "right");
    assert.match(dialog(view).props.className, /rounded-l-3xl/);
    feed.setDrawerSide("left");
    view = feed.render();
    assert.equal(content(view).props.placement, "left");
    assert.match(dialog(view).props.className, /rounded-r-3xl/);
    assert.doesNotMatch(dialog(view).props.className, /rounded-l-3xl/);
  } finally { feed.stop(); }
});
