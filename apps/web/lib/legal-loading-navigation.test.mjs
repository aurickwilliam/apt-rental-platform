import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import { TOC as termsContents } from "../app/(main)/tos/data/tos-sections.ts";
import { TOC as privacyContents } from "../app/(main)/pap/data/pap-sections.ts";
import { TOC as cookieContents } from "../app/(main)/cookies/data/cookies-sections.ts";

const routes = [
  { route: "tos", title: "Terms and", titleAccent: "Conditions", contents: termsContents },
  { route: "pap", title: "Privacy", titleAccent: "Policy", contents: privacyContents },
  { route: "cookies", title: "Cookie", titleAccent: "Policy", contents: cookieContents },
];

function load(file, modules = {}) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => name }),
    "@heroui/react": {
      Card: Object.assign(() => {}, { Header: "Card.Header", Content: "Card.Content" }),
      Skeleton: "Skeleton", Link: "HeroLink", Accordion: "Accordion", Button: "Button", Separator: "Separator",
    },
    "next/link": { default: "NextLink" },
    "next/image": { default: "Image" },
    ...modules,
  };
  const compiled = ts.transpileModule(readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => dependencies[name] ?? { default: name.split("/").at(-1) } };
  vm.runInNewContext(compiled, context);
  return context.exports.default;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const children = typeof element.type === "function" && element.type.name === "Placeholder"
    ? element.type(element.props)
    : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

function text(element) {
  return nodes(element).flatMap(node => [node.props?.children].flat(Infinity)).filter(child => typeof child === "string").join("");
}

for (const route of routes) {
  test(`${route.route} has its own legal loading boundary with the correct Contents count`, () => {
    const Loading = load(`(main)/${route.route}/loading.tsx`);
    const fallback = Loading();
    assert.equal(fallback.type, "LegalPageSkeleton");
    assert.equal(fallback.props.title, route.title);
    assert.equal(fallback.props.titleAccent, route.titleAccent);
    assert.equal(fallback.props.contentsCount, route.contents.length);

    const Skeleton = load("(main)/components/legal/LegalPageSkeleton.tsx");
    const tree = Skeleton(fallback.props);
    const all = nodes(tree);
    assert.equal(tree.props["aria-busy"], "true");
    assert.equal(tree.props["aria-label"], `Loading ${route.title} ${route.titleAccent}`);
    assert.equal(text(all.find(node => node.props?.role === "status")), `Loading ${route.title} ${route.titleAccent}…`);
    assert.equal(all.filter(node => node.props?.["aria-hidden"] === "true").length, 1);
    assert.match(all.find(node => node.props?.className?.includes("grid-cols-1")).props.className, /15rem.*lg:gap-8/);
    assert(all.some(node => node.props?.className?.includes("max-w-4xl")));
    assert(all.some(node => node.props?.className?.includes("lg:hidden")));
    const contents = all.find(node => node.type === "Card.Content" && node.props.className === "gap-0.5");
    assert.equal(contents.props.children.length, route.contents.length);
    const placeholders = all.filter(node => node.type === "Skeleton");
    assert(placeholders.length > route.contents.length * 2);
    assert(placeholders.every(node => node.props.animationType === "shimmer" && node.props.className.includes("motion-reduce:after:hidden")));
    assert(placeholders.every(node => node.props.className.includes("dark:bg-muted!")));
    assert(!all.some(node => ["a", "button", "NextLink", "HeroLink"].includes(node.type)));
  });
}

test("Policy links prefetch on hover/focus and keep Next.js native anchor behavior", () => {
  const calls = [];
  const Link = load("(main)/components/legal/LegalPolicyLink.tsx", {
    "next/navigation": { useRouter: () => ({ prefetch: href => calls.push(href) }) },
  });
  for (const route of routes) {
    const href = `/${route.route}`;
    const tree = Link({ href, className: "legal-link", children: route.title });
    assert.equal(tree.type, "HeroLink");
    assert.equal(tree.props.href, href);
    assert.equal(tree.props.className, "legal-link");
    tree.props.onHoverStart();
    tree.props.onFocus();
    const onClick = () => {};
    const ref = () => {};
    const rendered = tree.props.render({ href, ref, onClick, children: "Policy" });
    assert.equal(rendered.type, "NextLink");
    assert.equal(rendered.props.href, href);
    assert.equal(rendered.props.ref, ref);
    assert.equal(rendered.props.onClick, onClick);
    assert.equal(rendered.props.prefetch, true);
    assert.equal(tree.props.onClick, undefined);
    assert.equal(tree.props.onPress, undefined);
  }
  assert.deepEqual(calls, ["/tos", "/tos", "/pap", "/pap", "/cookies", "/cookies"]);
});

test("Both footer variants and related-policy links use the same fast client link", () => {
  const compound = name => Object.assign(() => {}, {
    Item: `${name}.Item`, Heading: `${name}.Heading`, Trigger: `${name}.Trigger`,
    Indicator: `${name}.Indicator`, Panel: `${name}.Panel`, Body: `${name}.Body`,
  });
  const Footer = load("components/layout/Footer.tsx", {
    "@heroui/react": { Accordion: compound("Accordion"), Button: "Button", Separator: "Separator", Link: "HeroLink" },
  });
  const footerLinks = nodes(Footer()).filter(node => node.type === "LegalPolicyLink");
  assert.equal(footerLinks.length, 6);
  for (const route of routes) assert.equal(footerLinks.filter(node => node.props.href === `/${route.route}`).length, 2);

  const Contact = load("(main)/components/legal/LegalContactCard.tsx");
  const tree = Contact({ brand: { email: "support@example.test", address: "Address", hours: "Hours" }, related: [{ href: "/tos", label: "Terms" }, { href: "/pap", label: "Privacy" }] });
  const links = nodes(tree).filter(node => node.type === "LegalPolicyLink");
  assert.deepEqual(links.map(node => node.props.href), ["/tos", "/pap"]);
  assert.equal(nodes(tree).find(node => node.type === "HeroLink").props.href, "mailto:support@example.test");
});
