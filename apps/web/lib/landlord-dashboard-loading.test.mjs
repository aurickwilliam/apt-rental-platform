import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadComponent(file) {
  const source = readFileSync(new URL(`../app/landlord/dashboard/${file}`, import.meta.url), "utf8");
  const jsx = (type, props) => typeof type === "function" ? type(props) : { type, props };
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@heroui/react": { Skeleton: "Skeleton" },
    "./DashboardHeader": { default: () => loadComponent("components/DashboardHeader.tsx")() },
    "./components/DashboardSkeleton": { default: () => loadComponent("components/DashboardSkeleton.tsx")() },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected loading dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports.default;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}

test("Dashboard route loading keeps its shared header visible and announces loading", () => {
  const tree = loadComponent("loading.tsx")();
  assert.equal(tree.props["aria-busy"], "true");
  assert.equal(tree.props["aria-label"], "Loading dashboard");
  const elements = nodes(tree);
  assert.equal(elements.find(node => node.type === "h1").props.children, "Dashboard");
  assert.ok(elements.some(node => node.type === "p" && node.props.children.includes("Welcome back!")));
  assert.ok(elements.some(node => node.props["aria-hidden"] === "true"));
});

test("Dashboard skeleton covers the collection card, four stat tiles and both panels", () => {
  const elements = nodes(loadComponent("loading.tsx")());
  assert.ok(elements.some(node => node.props.className?.includes("bg-primary")));
  const stats = elements.find(node => node.props.className?.includes("sm:grid-cols-2"));
  assert.equal(stats.props.children.length, 4);
  assert.deepEqual(elements.filter(node => node.type === "h3").map(node => node.props.children), [
    "Monthly Revenue", "Upcoming rent due",
  ]);
  const blocks = elements.filter(node => node.type === "Skeleton");
  assert.ok(blocks.length > 0);
  assert.ok(blocks.every(node => node.props.className.includes("bg-grey-300!")));
});
