import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";
import * as policies from "./registration-policies.ts";
import { terms, privacy } from "./test-support/legal-policy-runtime.mjs";

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const plain = value => JSON.parse(JSON.stringify(value));
const parts = (name, keys) => Object.assign(() => {}, Object.fromEntries(keys.map(key => [key, `${name}.${key}`])));

const Modal = compile("app/(auth)/components/RegistrationPoliciesModal.tsx", {
  react: { Component: class {}, useId: () => "dialog-instance", lazy: () => "RegistrationPolicyContent", Suspense: "Suspense" },
  "react/jsx-runtime": jsx,
  "@heroui/react": {
    Button: "Button", Spinner: "Spinner", Alert: parts("Alert", ["Indicator", "Content", "Description"]),
    Modal: parts("Modal", ["Backdrop", "Container", "Dialog", "CloseTrigger", "Header", "Heading", "Body", "Footer", "Icon"]),
    Tabs: parts("Tabs", ["ListContainer", "List", "Tab", "Indicator", "Panel"]),
  },
  "@/lib/registration-policies": policies,
  "@tabler/icons-react": { IconFileText: "IconFileText", IconInfoCircle: "IconInfoCircle", IconNotes: "IconNotes" },
}).default;

test("the shared modal selects either policy, keeps navigation and close outside scroll, and has no acceptance action", () => {
  for (const policy of ["privacy", "terms"]) {
    const selections = [], closes = [];
    const tree = Modal({ policy, onPolicyChange: value => selections.push(value), onClose: () => closes.push(true) });
    assert.equal(tree.props.isOpen, true);
    const all = nodes(tree);
    assert.equal(all.find(node => node.type === "Modal.Backdrop").props.variant, "blur");
    assert.ok(all.some(node => node.type === "Modal.Icon"));
    const tabs = all.find(node => node.props?.selectedKey);
    assert.equal(tabs.props.selectedKey, policy);
    assert.equal(tabs.props.variant, "secondary");
    tabs.props.onSelectionChange("terms"); tabs.props.onSelectionChange("privacy"); tabs.props.onSelectionChange("invalid");
    assert.deepEqual(selections, ["terms", "privacy"]);
    assert.equal(all.find(node => node.type === "RegistrationPolicyContent").props.policy, policy);
    assert.equal(all.filter(node => node.type === "RegistrationPolicyContent").length, 1);
    const body = all.find(node => node.type === "Modal.Body");
    assert.equal(nodes(body).some(node => node.type === "Modal.Footer" || node.type === "Modal.Header"), false);
    assert.equal(all.filter(node => node.type === "Tabs.Tab").length, 2);
    assert.ok(nodes(all.find(node => node.type === "Suspense").props.fallback).some(node => node.props?.role === "status"));
    const close = all.find(node => node.type === "Button");
    assert.equal(close.props.type, "button"); assert.equal(close.props.children, "Close");
    assert.equal(close.props.variant, "primary");
    close.props.onPress(); tree.props.onOpenChange(false);
    assert.equal(closes.length, 2);
  }
  assert.equal(Modal({ policy: null, onPolicyChange() {}, onClose() {} }).props.isOpen, false);
});

const Content = compile("app/(auth)/components/RegistrationPolicyContent.tsx", {
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
