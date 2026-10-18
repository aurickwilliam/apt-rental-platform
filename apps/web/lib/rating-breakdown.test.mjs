import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("overall apartment rating matches the yellow stars without recoloring review text", () => {
  const source = readFileSync(new URL("../app/browse/[apartmentId]/components/RatingBreakdown.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  const modules = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Meter: Object.assign(() => {}, { Track: "Track", Fill: "Fill" }) },
    "@tabler/icons-react": { IconStar: "Star", IconStarFilled: "StarFilled" },
  };
  const context = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(compiled, context);
  const tree = context.exports.default({ overallRate: 4.5, totalReviews: 2, no5Star: 1, no4Star: 1, no3Star: 0, no2Star: 0, no1Star: 0 });
  const nodes = element => !element || typeof element !== "object" ? [] :
    [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
  const all = nodes(tree);
  const score = all.find(node => node.type === "h3");
  assert.equal(score.props.children, 4.5);
  assert.match(score.props.className, /\btext-rating\b/);
  assert.doesNotMatch(score.props.className, /\btext-brand\b/);
  assert.ok(all.filter(node => ["Star", "StarFilled"].includes(node.type)).every(node => node.props.className === "text-rating"));
  assert.ok(all.filter(node => node.type === "p").every(node => !node.props.className.includes("text-rating")));
});
