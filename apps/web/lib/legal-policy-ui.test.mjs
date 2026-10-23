import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import * as privacy from "../app/(main)/pap/data/pap-sections.ts";
import * as cookies from "../app/(main)/cookies/data/cookies-sections.ts";

const policies = [
  { name: "Privacy", route: "pap", data: privacy, count: 13, infoIndex: 1, warningIndex: 10, related: [{ href: "/tos", label: "Terms of Service" }, { href: "/cookies", label: "Cookie Policy" }] },
  { name: "Cookie", route: "cookies", data: cookies, count: 9, infoIndex: 3, warningIndex: 5, related: [{ href: "/tos", label: "Terms of Service" }, { href: "/pap", label: "Privacy Policy" }] },
];
const normalize = value => JSON.parse(JSON.stringify(value));

function load(file, modules) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@tabler/icons-react": { IconCookie: "IconCookie", IconShieldCheck: "IconShieldCheck", IconClock: "IconClock", IconMail: "IconMail", IconMapPin: "IconMapPin" },
    "@heroui/react": { Card: Object.assign(() => {}, { Content: "Card.Content" }), Link: "HeroLink" },
    "next/link": { default: "NextLink" },
    "./data/pap-sections": privacy,
    "./data/cookies-sections": cookies,
    ...modules,
  };
  const source = readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => dependencies[name] ?? { default: name.split("/").at(-1) } };
  vm.runInNewContext(compiled, context);
  return { ...context.exports, source };
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}

for (const policy of policies) {
  const pagePath = `(main)/${policy.route}/page.tsx`;
  const { BRAND, LEGAL_META, SECTIONS, TOC } = policy.data;

  test(`${policy.name} uses the Terms legal shell, server metadata and original hero metadata`, () => {
    const page = load(pagePath);
    const all = nodes(page.default());
    assert.doesNotMatch(page.source, /^\s*["']use client["']/);
    assert.equal(page.metadata.title, `${policy.name} Policy — APT`);
    const hero = all.find(node => node.type === "LegalHero");
    assert.equal(hero.props.title, policy.name);
    assert.equal(hero.props.titleAccent, "Policy");
    assert.equal(hero.props.description, page.metadata.description);
    assert.deepEqual(hero.props.meta, LEGAL_META);
    assert.match(all.find(node => node.type === "article").props.className, /max-w-4xl/);
    assert.match(all[0].props.className, /bg-muted\/30 dark:bg-background/);
    assert.match(all.find(node => node.props.className?.includes("grid-cols-1")).props.className, /15rem.*lg:gap-8/);
  });

  test(`${policy.name} preserves every paragraph, subheading, list and callout in order`, () => {
    const sections = nodes(load(pagePath).default()).filter(node => node.type === "LegalSection");
    const Blocks = load("(main)/components/legal/LegalBlocks.tsx").default;
    assert.equal(sections.length, policy.count);
    sections.forEach((node, index) => {
      const original = SECTIONS[index];
      assert.equal(node.props.id, original.id);
      assert.equal(node.props.num, original.num);
      assert.equal(node.props.title, original.title);
      assert.equal(node.props.emphasis, original.emphasis);
      assert.deepEqual(node.props.callout, original.callout);
      const content = node.props.children;
      assert.equal(content.type, "LegalBlocks");
      assert.deepEqual(content.props.blocks, original.blocks);
      const blocks = Blocks(content.props).props.children;
      assert.equal(blocks.length, original.blocks.length);
      blocks.forEach((block, blockIndex) => {
        const expected = original.blocks[blockIndex];
        if (expected.type === "list") {
          assert.equal(block.type, "LegalBulletList");
          assert.deepEqual(block.props.items, expected.items);
        } else {
          assert.equal(block.type, expected.type === "subheading" ? "h3" : "p");
          assert.equal(block.props.children, expected.text);
          if (expected.type === "subheading") assert.match(block.props.className, /font-nunito/);
        }
      });
    });
    assert.equal(sections[policy.infoIndex].props.callout.kind, "info");
    assert.equal(sections[policy.warningIndex].props.callout.kind, "warning");
  });

  test(`${policy.name} Contents matches all section anchors and contact links stay policy-specific`, () => {
    assert.deepEqual(TOC.map(item => item.id), SECTIONS.map(section => section.id));
    assert(TOC.every(item => !/^\d+\./.test(item.label)));
    const all = nodes(load(pagePath).default());
    assert.deepEqual(all.find(node => node.type === "LegalTableOfContents").props.items, TOC);
    const contact = all.find(node => node.type === "LegalContactCard");
    assert.deepEqual(contact.props.brand, BRAND);
    assert.equal(contact.props.eyebrow, `Questions about this ${policy.name} Policy?`);
    assert.equal(contact.props.description, null);
    assert.deepEqual(normalize(contact.props.related), policy.related);
  });
}

test("Shared contact copy keeps Terms defaults and allows Privacy's existing question", () => {
  const { BRAND } = privacy;
  const Contact = load("(main)/components/legal/LegalContactCard.tsx").default;
  const text = tree => nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(child => typeof child === "string");
  const terms = text(Contact({ brand: BRAND }));
  assert(terms.includes("Questions?"));
  assert(terms.includes("Reach us about these terms or how your information is handled."));
  const privacyText = text(Contact({ brand: BRAND, eyebrow: "Questions about this Privacy Policy?", description: null }));
  assert(privacyText.includes("Questions about this Privacy Policy?"));
  assert(!privacyText.some(value => value.includes("these terms")));
  assert(privacyText.includes(BRAND.email));
  assert(privacyText.includes(BRAND.address));
  assert(privacyText.includes(BRAND.hours));
});
