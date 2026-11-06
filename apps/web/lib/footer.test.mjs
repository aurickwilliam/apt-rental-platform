import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props });
const source = readFileSync(new URL("../app/components/layout/Footer.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dependencies = {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "@heroui/react": {
    Accordion: Object.assign("Accordion", Object.fromEntries(["Item", "Heading", "Trigger", "Indicator", "Panel", "Body"].map(part => [part, `Accordion.${part}`]))),
    Button: "Button", Separator: "Separator", Link: "Link",
  },
  "@tabler/icons-react": { IconBrandX: "X", IconBrandFacebook: "Facebook", IconBrandInstagram: "Instagram" },
  "next/image": { default: "Image" },
  "@/app/(main)/components/legal/LegalPolicyLink": { default: "LegalPolicyLink" },
};
const context = { exports: {}, require: name => {
  assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
  return dependencies[name];
} };
vm.runInNewContext(compiled, context);
const tree = context.exports.default();
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}
const all = nodes(tree);

test("both web footer layouts keep useful links and direct owners to the existing journey", () => {
  const links = all.filter(node => node.type === "Link");
  const expected = [["/about", "About Us"], ["/#contact", "Contact Us"], ["/#faqs", "FAQ"], ["/browse", "Search Rentals"], ["/forowners", "List Your Property"], ["/sign-in", "Sign In"]];
  assert.equal(links.length, expected.length * 2);
  for (const [href, label] of expected) {
    assert.equal(links.filter(node => node.props.href === href && node.props.children === label).length, 2);
  }
  for (const removed of ["/company", "/careers", "/community", "/help", "/safety", "/apply", "/list-property"]) {
    assert.equal(all.some(node => node.props?.href === removed), false);
  }
});

test("social icons, Facebook destination, address, logo and legal links are retained", () => {
  for (const name of ["X", "Facebook", "Instagram"]) {
    assert.equal(all.filter(node => node.type === name).length, 2);
    assert.equal(all.filter(node => node.type === "Button" && node.props["aria-label"] === name).length, 2);
  }
  assert.equal(all.filter(node => node.props?.href === "https://www.facebook.com/profile.php?id=61583486606822").length, 2);
  for (const href of ["/tos", "/pap", "/cookies"]) {
    assert.equal(all.filter(node => node.type === "LegalPolicyLink" && node.props.href === href).length, 2);
  }
  assert.equal(all.filter(node => node.props?.children === "109 Samson Road corner Caimito Road, Caloocan, Philippines").length, 2);
  assert.ok(all.some(node => node.type === "Image" && node.props.src === "/logo/logo-name.svg"));
});

test("footer reduces the desktop gap and allows the legal rows to wrap", () => {
  assert.ok(all.some(node => node.props?.className === "hidden md:block mt-8"));
  assert.equal(source.includes("mt-20"), false);
  const policyRows = all.filter(node => [node.props?.children].flat().some(child => child?.type === "LegalPolicyLink"));
  assert.equal(policyRows.length, 2);
  assert.ok(policyRows.every(node => node.props.className.includes("flex-wrap")));
});
