import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as rowHelpers from "../../../packages/utils/src/notificationRow.ts";
import { getNotificationPreview } from "../../../packages/utils/src/notificationPreview.ts";

const jsx = (type, props) => ({ type, props });
const exports = {};
const modules = {
  "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
  "@tabler/icons-react": new Proxy({}, { get: (_, name) => String(name) }),
  "@repo/utils": { ...rowHelpers, getNotificationPreview, getRelativeTime: () => "Yesterday at 7:51 PM" },
};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../app/components/notifications/NotificationRow.tsx", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports, require: name => {
  assert.ok(name in modules, name);
  return modules[name];
} });
const NotificationRow = exports.default;
const nodes = value => !value || typeof value !== "object" ? []
  : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const text = value => typeof value === "string" ? value
  : !value || typeof value !== "object" ? "" : [value.props?.children].flat(Infinity).map(text).join("");
const notification = {
  id: "message", type: "message", title: "Mhart Aaron", message: "Hello",
  data: { screen: "chat" }, created_at: "2026-10-18T11:51:00Z", is_read: false,
};

test("message row has an inline semibold identity, regular action, quoted preview and semantic time", () => {
  const tree = NotificationRow({ notification, onOpen: () => {} });
  assert.equal(tree.type, "button");
  assert.equal(tree.props.type, "button");
  assert.match(text(tree), /Mhart Aaron sent you a message“Hello”Yesterday at 7:51 PM/);
  const name = nodes(tree).find(n => n.type === "span" && n.props.className?.includes("font-semibold"));
  assert.equal(text(name), "Mhart Aaron");
  assert.equal(nodes(tree).find(n => n.type === "time").props.dateTime, notification.created_at);
  assert.match(tree.props["aria-label"], /Mhart Aaron, sent you a message, Hello, unread, Yesterday/);
  assert.match(tree.props.className, /notification-feed-row/);
});

test("compact members remove visible identity/icons while retaining accessible names, timestamps and click behavior", () => {
  let opened = 0;
  for (const is_read of [false, true]) {
    const tree = NotificationRow({ notification: { ...notification, is_read }, compact: true, onOpen: () => { opened++; } });
    assert.equal(text(tree), "“Hello”Yesterday at 7:51 PM");
    assert.ok(!nodes(tree).some(n => n.props?.className === "notification-feed-icon"));
    assert.match(tree.props["aria-label"], /Mhart Aaron, sent you a message, Hello/);
    assert.equal(tree.props["aria-label"].includes(", unread"), !is_read);
    assert.match(tree.props.className, /notification-feed-member/);
    tree.props.onClick();
  }
  assert.equal(opened, 2);
});

test("reactions use their action inline and original-message preview without a second preview icon", () => {
  const tree = NotificationRow({ notification: { ...notification, message: "Reacted 😍 to your message",
    data: { screen: "chat", event: "reaction", messagePreview: "sire" } }, onOpen: () => {} });
  assert.match(text(tree), /Mhart Aaron reacted 😍 to your message“sire”/);
  assert.equal(nodes(tree).filter(n => n.type === "IconMessageCircle").length, 1);
});

test("long copy stays intact for assistive technology while visible previews truncate", () => {
  const message = "A very long message ".repeat(30);
  const title = "A very long sender name ".repeat(12);
  const tree = NotificationRow({ notification: { ...notification, title, message }, onOpen: () => {} });
  assert.ok(tree.props["aria-label"].includes(message));
  assert.ok(tree.props["aria-label"].includes(title));
  assert.ok(nodes(tree).some(n => n.props?.className?.includes("notification-feed-preview") && text(n).includes(message)));
  assert.ok(nodes(tree).some(n => n.props?.className?.includes("notification-feed-primary")));
});

test("every event uses the same title/description/time hierarchy for historical and recent copy", () => {
  const events = [
    ["message", "New Message", "Emma: Hello", { screen: "chat" }],
    ["payment", "Payment Received", "Rent payment of ₱8,000 received.", { screen: "payments" }],
    ["payment", "Cash Payment Received", "May paid cash for Unit 3.", { screen: "payments" }],
    ["apartment", "New Application", "A rental application was submitted.", { screen: "application" }],
    ["maintenance", "New Maintenance Request", "A leaking tap needs repair.", { screen: "maintenance" }],
    ["maintenance", "Maintenance Resolved", "Your request has been resolved.", { screen: "maintenance" }],
    ["system", "Apartment verification approved", "Your apartment is verified.", { screen: "verification" }],
    ["system", "Account verification approved", "Your account is verified.", { screen: "verification" }],
    ["system", "New account verification submitted", "ID documents are ready for review.", { screen: "verification" }],
    ["system", "New passport document submitted", "Proof of income is ready for review.", { screen: "passportReview" }],
    ["apartment", "New Visit Request", "A tenant requested a visit.", { screen: "visitRequests" }],
    ["future", "Other supported activity", "Keep the original description.", { screen: "future" }],
  ];
  for (const [type, title, message, data] of events) {
    for (const is_read of [false, true]) {
      for (const historical of [false, true]) {
        let opened = 0;
        const row = { ...notification, type, title, message, is_read,
          data: historical ? null : data,
          created_at: historical ? "2024-01-01T00:00:00Z" : notification.created_at };
        const tree = NotificationRow({ notification: row, onOpen: () => { opened++; } });
        const all = nodes(tree);
        assert.equal(tree.props.className, "notification-feed-row");
        assert.equal(all.filter(n => n.props?.className === "notification-feed-icon").length, 1);
        assert.equal(all.filter(n => n.props?.className === "notification-feed-primary").length, 1);
        assert.equal(all.filter(n => n.props?.className?.includes("notification-feed-preview")).length, 1);
        assert.equal(all.filter(n => n.type === "time").length, 1);
        assert.equal(tree.props["aria-label"].includes(", unread"), !is_read);
        assert.ok(tree.props["aria-label"].includes(message));
        assert.ok(text(tree).includes(title));
        if (historical) {
          assert.equal(text(all.find(n => n.props?.className === "notification-feed-primary")), title);
          assert.equal(text(all.find(n => n.props?.className?.includes("notification-feed-preview"))), message);
        }
        tree.props.onClick();
        assert.equal(opened, 1);
      }
    }
  }
});

test("title-only and description-only records keep the same structure without filler copy", () => {
  for (const [title, message] of [["Payment Received", null], ["", "Original historical description"]]) {
    const tree = NotificationRow({ notification: { ...notification, title, message, data: null }, onOpen: () => {} });
    assert.equal(text(tree), `${title}${message ?? ""}Yesterday at 7:51 PM`);
    assert.equal(nodes(tree).filter(n => n.type === "time").length, 1);
  }
});

test("Tenant, Landlord and Admin mount the same drawer and shared presentation", () => {
  for (const portal of ["tenant", "landlord", "admin"]) {
    const layout = readFileSync(new URL(`../app/${portal}/layout.tsx`, import.meta.url), "utf8");
    assert.ok(layout.includes(`<NotificationsOverlay activePortal="${portal}" />`));
  }
  const overlay = readFileSync(new URL("../app/components/notifications/NotificationsOverlay.tsx", import.meta.url), "utf8");
  assert.ok(overlay.includes("<NotificationDrawer activePortal={activePortal}"));
  const group = readFileSync(new URL("../app/components/notifications/NotificationGroupRow.tsx", import.meta.url), "utf8");
  for (const part of ["primary", "preview", "time"]) {
    assert.ok(group.includes(`notification-feed-${part}`), `groups share ${part} typography with every row`);
  }
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.notification-feed-primary\s*\{[^}]*line-clamp-2/);
  assert.match(css, /\.notification-feed-preview\s*\{[^}]*truncate/);
});
