import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const jsx = (type, props) => ({ type, props });
function renderRow(props) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source("app/components/settings/SettingsRow.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require: name => ({
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "next/link": { default: "Link" },
      "@heroui/react": { Button: "Button" },
      "@tabler/icons-react": { IconChevronRight: "IconChevronRight" },
    })[name],
  });
  return exports.default({ icon: "icon", title: "Theme", description: "A long description", suffix: "control", ...props });
}

test("General opts into wrapping, stacking only Theme and keeping Reduce motion inline", () => {
  const general = source("app/components/settings/tabs/GeneralTab.tsx");
  assert.match(general, /title="Theme"\s+responsiveLayout="stack-control"/);
  assert.match(general, /title="Reduce motion"\s+responsiveLayout="wrap"/);
  assert.match(general, /className="w-full min-w-0 sm:w-40"/);
  assert.match(general, /onChange=\{setTheme\}/);
  assert.match(general, /onValueChange=\{setReducedMotion\}/);
});

test("responsive Settings rows wrap readable copy while other rows retain their layout", () => {
  const ordinary = renderRow({});
  assert.ok(!ordinary.props.className.includes("settings-row-responsive"));
  assert.match(ordinary.props.children[1].props.children[1].props.className, /truncate/);
  for (const responsiveLayout of ["wrap", "stack-control"]) {
    const row = renderRow({ responsiveLayout });
    assert.match(row.props.className, /settings-row-responsive/);
    const label = row.props.children[1];
    for (const text of label.props.children) {
      assert.match(text.props.className, /whitespace-normal break-words/);
      assert.doesNotMatch(text.props.className, /truncate/);
    }
    assert.equal(row.props.className.includes("settings-row-stack-control"), responsiveLayout === "stack-control");
  }
});

test("Settings navigation keeps horizontal scroll and the fixed desktop rail", () => {
  const modal = source("app/components/settings/SettingsModal.tsx");
  assert.match(modal, /settings-category-nav[^"\n]*min-w-0[^"\n]*justify-start[^"\n]*overflow-x-auto[^"\n]*md:w-52 md:flex-col/);
  assert.match(modal, /settings-category-button[^\n]*items-center justify-start gap-2/);
  assert.match(modal, /onClick=\{\(\) => setTab\(id\)\}/);
  assert.match(modal, /bg-primary text-primary-foreground/);
});

test("selected categories reveal themselves on mobile without scrolling the desktop rail", () => {
  const modal = source("app/components/settings/SettingsModal.tsx");
  assert.match(modal, /matchMedia\("\(max-width: 767px\)"\)/);
  assert.match(modal, /querySelector<HTMLButtonElement>\('\[aria-current="page"\]'\)\?\.scrollIntoView/);
  assert.match(modal, /block: "nearest",\s+inline: "nearest",\s+behavior: "instant"/);
  assert.match(modal, /observer\.disconnect\(\)/);
  assert.match(modal, /\[activeId, open, canShowRental\]/);
});

test("scoped category and General styles protect alignment, icons and narrow controls", () => {
  const css = source("app/globals.css");
  assert.match(css, /\.settings-category-button\.button\s*\{\s*justify-content: flex-start;/);
  assert.match(css, /\.settings-category-button\.button > svg\s*\{\s*flex: 0 0 18px;/);
  assert.match(css, /\.settings-category-nav\s*\{[^}]*scrollbar-width: thin;/);
  assert.match(css, /\.settings-row-responsive\s*\{\s*grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  assert.match(css, /@media \(max-width: 639\.98px\) \{\s*\.settings-row-stack-control/);
  assert.match(css, /\.settings-row-stack-control > :last-child\s*\{\s*grid-column: 2;\s*justify-self: stretch;/);
});
