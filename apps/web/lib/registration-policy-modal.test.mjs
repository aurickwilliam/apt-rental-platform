import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import * as policies from "./registration-policies.ts";
import { terms, privacy } from "./test-support/legal-policy-runtime.mjs";

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const plain = value => JSON.parse(JSON.stringify(value));
const parts = (name, keys) => Object.assign(() => {}, Object.fromEntries(keys.map(key => [key, `${name}.${key}`])));

function modalHarness(policy) {
  const runtime = hookRuntime();
  const closes = [];
  let props = { policy, isOpen: true, reviewed: false, onRead() {}, onClose: () => closes.push(true) };
  const Modal = compile("app/(auth)/components/RegistrationPoliciesModal.tsx", {
    react: { ...runtime.react, Component: class {}, useId: () => "dialog-instance", lazy: () => "RegistrationPolicyContent", Suspense: "Suspense" },
    "react/jsx-runtime": jsx,
    "@heroui/react": {
      Button: "Button", Spinner: "Spinner", Alert: parts("Alert", ["Indicator", "Content", "Description"]),
      Modal: parts("Modal", ["Backdrop", "Container", "Dialog", "CloseTrigger", "Header", "Heading", "Body", "Footer", "Icon"]),
    },
    "@/lib/registration-policies": policies,
    "@tabler/icons-react": { IconFileText: "IconFileText", IconInfoCircle: "IconInfoCircle", IconNotes: "IconNotes" },
  }).default;
  const render = () => runtime.render(() => Modal(props));
  const all = () => nodes(render());
  return { render, all, closes, set: next => { props = { ...props, ...next }; }, content: () => all().find(node => node.type === "RegistrationPolicyContent") };
}

test("each policy has a single-document dialog with its own title, no tabs and a keyboard-scrollable region", () => {
  for (const policy of ["privacy", "terms"]) {
    const h = modalHarness(policy);
    const tree = h.render();
    assert.equal(tree.props.isOpen, true);
    const all = nodes(tree);
    assert.equal(all.find(node => node.type === "Modal.Backdrop").props.variant, "blur");
    assert.ok(all.some(node => node.type === "Modal.Icon"));
    assert.equal(all.find(node => node.type === "Modal.Heading").props.children, policies.REGISTRATION_POLICIES[policy].label);
    assert.equal(all.find(node => node.type === "RegistrationPolicyContent").props.policy, policy);
    assert.equal(all.filter(node => node.type === "RegistrationPolicyContent").length, 1);
    const body = all.find(node => node.type === "Modal.Body");
    assert.equal(nodes(body).some(node => node.type === "Modal.Footer" || node.type === "Modal.Header"), false);
    assert.equal(all.some(node => node.type?.startsWith?.("Tabs.")), false);
    const panel = all.find(node => node.props?.["data-registration-policy-scroll"] !== undefined);
    assert.equal(panel.props.role, "region");
    assert.equal(panel.props.tabIndex, 0);
    assert.ok(nodes(all.find(node => node.type === "Suspense").props.fallback).some(node => node.props?.role === "status"));
    const close = all.find(node => node.type === "Button");
    assert.equal(close.props.type, "button"); assert.equal(close.props.children, "Close");
    assert.equal(close.props.variant, "primary");
    close.props.onPress(); tree.props.onOpenChange(false);
    assert.equal(h.closes.length, 2, "loading content stays dismissible");
  }
});

test("loaded unread documents lock Close, X, Escape, backdrop and guarded close callbacks until reviewed", () => {
  for (const policy of ["privacy", "terms"]) {
    const h = modalHarness(policy);
    h.content().props.onReady();
    const backdrop = () => h.all().find(node => node.type === "Modal.Backdrop");
    const close = () => h.all().find(node => node.type === "Button");
    const x = () => h.all().find(node => node.type === "Modal.CloseTrigger");
    assert.equal(backdrop().props.isDismissable, false);
    assert.equal(backdrop().props.isKeyboardDismissDisabled, true);
    assert.equal(close().props.isDisabled, true);
    assert.equal(x().props.isDisabled, true);
    close().props.onPress(); h.render().props.onOpenChange(false);
    assert.equal(h.closes.length, 0);
    h.set({ reviewed: true });
    assert.equal(close().props.isDisabled, false);
    assert.equal(x().props.isDisabled, false);
    assert.equal(backdrop().props.isDismissable, true);
    assert.equal(backdrop().props.isKeyboardDismissDisabled, false);
    close().props.onPress(); h.render().props.onOpenChange(false);
    assert.equal(h.closes.length, 2);
  }
});

test("a render/load failure unlocks dismissal and retry re-locks only after content is ready", () => {
  const h = modalHarness("privacy");
  const boundary = () => h.all().find(node => node.type?.name === "PolicyContentBoundary");
  h.content().props.onReady();
  boundary().props.onError();
  assert.equal(h.all().find(node => node.type === "Button").props.isDisabled, false);
  boundary().props.onRetry();
  assert.equal(h.all().find(node => node.type === "Button").props.isDisabled, false);
  h.content().props.onReady();
  assert.equal(h.all().find(node => node.type === "Button").props.isDisabled, true);
});

test("dismissal releases the document and an unread reopening starts dismissible until readiness", () => {
  const h = modalHarness("privacy");
  h.content().props.onReady();
  h.set({ isOpen: false }); h.render();
  assert.equal(h.content(), undefined);
  h.set({ isOpen: true }); h.render();
  assert.equal(h.all().find(node => node.type === "Button").props.isDisabled, false);
  h.content().props.onReady();
  assert.equal(h.all().find(node => node.type === "Button").props.isDisabled, true);
});

const Content = compile("app/(auth)/components/RegistrationPolicyContent.tsx", {
  react: { memo: component => component, useEffect() {} },
  "@/hooks/use-policy-scroll-completion": { usePolicyScrollCompletion: () => ({ current: null }) },
  "react/jsx-runtime": jsx, "@/lib/registration-policies": policies,
  "@heroui/react": { Alert: parts("Alert", ["Indicator", "Content", "Title", "Description"]) },
  "@tabler/icons-react": { IconInfoCircleFilled: "IconInfoCircleFilled" },
  "../../(main)/components/legal/LegalBlocks": { default: "LegalBlocks" },
  "../../(main)/components/legal/LegalBulletList": { default: "LegalBulletList" },
  "../../(main)/components/legal/LegalContactCard": { default: "LegalContactCard" },
  "../../(main)/components/legal/LegalSection": { default: "LegalSection" },
  "../../(main)/pap/data/pap-sections": privacy,
  "../../(main)/tos/data/tos-sections": terms,
}).default;

test("modal policy content preserves every public policy section, paragraph, list, callout and contact detail", () => {
  for (const [policy, data] of [["privacy", privacy], ["terms", terms]]) {
    const root = Content({ policy, instanceId: "first-dialog" });
    const all = nodes(root);
    const sections = all.filter(node => node.type === "LegalSection");
    assert.equal(root.props["aria-label"], policies.REGISTRATION_POLICIES[policy].label);
    assert.ok(all.some(node => node.props?.className === "registration-policy-meta"));
    assert.equal(sections.length, data.SECTIONS.length);
    sections.forEach((node, index) => {
      const section = data.SECTIONS[index];
      assert.equal(node.props.id, `first-dialog-${policy}-${section.id}`);
      assert.equal(node.props.headingLevel, 3);
      for (const field of ["num", "title", "emphasis", "callout"]) assert.deepEqual(plain(node.props[field] ?? null), plain(section[field] ?? null));
      if (policy === "privacy") {
        assert.equal(node.props.children.type, "LegalBlocks");
        assert.deepEqual(plain(node.props.children.props.blocks), plain(section.blocks));
      } else {
        const children = nodes(node).slice(1);
        assert.deepEqual(children.filter(child => child.type === "p").map(child => child.props.children), [section.intro, ...(section.body ?? [])].filter(Boolean));
        if (section.list) assert.deepEqual(plain(children.find(child => child.type === "LegalBulletList").props.items), plain(section.list));
      }
    });
    const contact = all.find(node => node.type === "LegalContactCard");
    assert.deepEqual(plain(contact.props.brand), plain(data.BRAND));
    assert.equal(contact.props.related, undefined);
    assert.ok(JSON.stringify(root).includes(data.LEGAL_META.lastUpdated));
    const another = nodes(Content({ policy, instanceId: "second-dialog" })).find(node => node.type === "LegalSection");
    assert.notEqual(another.props.id, sections[0].props.id);
  }
});
