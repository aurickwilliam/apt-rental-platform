import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadEmptyState() {
  const source = readFileSync(new URL("../app/components/display/EmptyState.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  const context = { exports: {}, require: name => {
    assert.equal(name, "react/jsx-runtime");
    return { jsx, jsxs: jsx };
  } };
  vm.runInNewContext(compiled, context);
  return context.exports.default;
}

const nodes = element => {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
};
const EmptyState = loadEmptyState();
const Icon = ({ size }) => ({ type: "Icon", props: { size } });
const render = props => nodes(EmptyState({ icon: Icon, title: "No items yet", ...props }));
const root = props => render(props)[0];

test("renders the icon on the soft-blue circle at the shared size, with the title", () => {
  const tree = render({});
  const circle = tree.find(node => node.type === "span");
  assert.ok(circle.props.className.includes("bg-secondary"));
  assert.ok(circle.props.className.includes("rounded-full"));
  const icon = tree.find(node => node.type === Icon);
  assert.equal(icon.props.size, 28);
  assert.equal(icon.props["aria-hidden"], "true");
  assert.ok(tree.some(node => node.type === "p" && node.props.children === "No items yet"));
});

test("omits the description and action unless given, and renders them when given", () => {
  const bare = render({});
  assert.equal(bare.filter(node => node.type === "p").length, 1);
  assert.equal(bare.some(node => node.props?.className?.includes("mt-1")), false);
  const full = render({ description: "Items appear here.", action: { type: "Button", props: {} } });
  assert.ok(full.some(node => node.type === "p" && node.props.children === "Items appear here."));
  assert.ok(full.some(node => node.type === "Button"));
});

test("uses the default vertical padding unless the caller sets its own", () => {
  assert.ok(root({}).props.className.includes("py-16"));
  const custom = root({ className: "py-6" }).props.className;
  assert.equal(custom.includes("py-16"), false);
  assert.ok(custom.includes("py-6"));
  assert.ok(root({ className: "flex-1 min-h-80" }).props.className.includes("py-16"));
});

test("framed adds the dashed card and the default is unframed", () => {
  assert.ok(root({ framed: true }).props.className.includes("border-dashed"));
  assert.equal(root({}).props.className.includes("border-dashed"), false);
});
