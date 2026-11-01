import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(file) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => name }),
    "@heroui/react": { Button: "Button" },
    "next/link": { default: "Link" },
    // The Passport header is a client component; a key-echo lookup keeps the
    // typography assertions focused on class names.
    "@/app/components/i18n/LocaleProvider": {
      useTranslation: () => ({ language: "en", pending: false, setLanguage() {}, t: key => key }),
    },
  };
  const source = readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected header dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}

const passport = nodes(load("components/passport/PassportPageLayout.tsx").PassportPageHeader());
const passportTitle = passport.find(node => node.type === "h1");
const passportTile = passport.find(node => node.type === "span");
const passportDescription = passport.find(node => node.type === "p");

for (const [route, file, title, icon] of [
  ["properties", "PropertiesHeader", "My Properties", "IconBuilding"],
  ["applications", "ApplicationsHeader", "Applications", "IconFileCheck"],
  ["maintenance-requests", "MaintenanceHeader", "Maintenance Requests", "IconTools"],
  ["payments", "PaymentsHeader", "Payments", "IconCashBanknote"],
]) {
  test(`${title} matches Passport typography, icon tile, description alignment and decorative icon accessibility`, () => {
    const tree = load(`landlord/${route}/components/${file}.tsx`).default({});
    const elements = nodes(tree);
    const heading = elements.find(node => node.type === "h1");
    assert.equal(heading.props.className, passportTitle.props.className);
    assert.ok([heading.props.children].flat().includes(title));
    const tile = nodes(heading).find(node => node.type === "span");
    assert.equal(tile.props.className, passportTile.props.className);
    const symbol = nodes(tile).find(node => node.type === icon);
    assert.equal(symbol.props.size, 28);
    assert.equal(symbol.props["aria-hidden"], "true");
    const description = elements.find(node => node.type === "p");
    assert.deepEqual(description.props.className.split(" ").sort(), passportDescription.props.className.split(" ").sort());
  });
}

test("Payments heading has no Back button and no trailing action of its own", () => {
  const elements = nodes(load("landlord/payments/components/PaymentsHeader.tsx").default({}));
  assert.ok(!elements.some(node => node.type === "IconArrowLeft"));
  assert.equal(elements.filter(node => node.type === "Button").length, 0);
});
