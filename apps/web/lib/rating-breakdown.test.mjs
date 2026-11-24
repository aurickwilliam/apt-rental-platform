import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { translate } from "../../../packages/i18n/src/index.ts";

function loadBreakdown() {
  const source = readFileSync(new URL("../app/browse/[apartmentId]/components/RatingBreakdown.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  const modules = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Meter: Object.assign(() => {}, { Track: "Track", Fill: "Fill" }) },
    "@tabler/icons-react": { IconStarFilled: "StarFilled" },
    "@/app/components/display/StarRating": { __esModule: true, default: "StarRating" },
    "@/app/components/i18n/LocaleProvider": {
      useTranslation: () => ({
        language: "en",
        t: (key, vars) => translate("en", key, vars),
      }),
    },
  };
  const context = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(compiled, context);
  return context.exports.default;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}

function text(element) {
  if (element === null || element === undefined || element === false) return "";
  if (typeof element !== "object") return String(element);
  return [element.props?.children].flat(Infinity).map(text).join("");
}

const RATINGS = { no5Star: 1, no4Star: 1, no3Star: 0, no2Star: 0, no1Star: 0 };

test("overall apartment rating matches the yellow stars without recoloring review text", () => {
  const RatingBreakdown = loadBreakdown();
  const tree = RatingBreakdown({ overallRate: 4.5, totalReviews: 2, ...RATINGS });
  const all = nodes(tree);

  const score = all.find(node => node.type === "h3");
  assert.equal(score.props.children, 4.5);
  assert.match(score.props.className, /\btext-rating\b/);
  assert.doesNotMatch(score.props.className, /\btext-brand\b/);

  const stars = all.find(node => node.type === "StarRating");
  assert.ok(stars, "the score reuses the shared StarRating");
  assert.equal(stars.props.rating, 4.5);
  assert.match(stars.props.className, /justify-center/);

  assert.ok(all.filter(node => node.type === "StarFilled").every(node => node.props.className === "text-rating"));
  assert.ok(all.filter(node => node.type === "p").every(node => !node.props.className.includes("text-rating")));
});

test("rating summary counts use singular and plural copy", () => {
  const RatingBreakdown = loadBreakdown();
  const rowCounts = tree =>
    nodes(tree)
      .filter(node => node.type === "p" && typeof node.props?.className === "string" && node.props.className.includes("w-16"))
      .map(text);

  const twoTree = RatingBreakdown({ overallRate: 4.5, totalReviews: 2, ...RATINGS });
  assert.match(text(twoTree), /Based on 2 reviews/);
  assert.ok(rowCounts(twoTree).includes("1 review"));
  assert.ok(rowCounts(twoTree).includes("0 reviews"));
  assert.ok(
    nodes(twoTree)
      .filter(node => typeof node.props?.["aria-label"] === "string" && node.props["aria-label"].includes(" star"))
      .every(node => / of 2 reviews$/.test(node.props["aria-label"])),
  );

  const oneTree = RatingBreakdown({
    overallRate: 5,
    totalReviews: 1,
    no5Star: 1,
    no4Star: 0,
    no3Star: 0,
    no2Star: 0,
    no1Star: 0,
  });
  const oneText = text(oneTree);
  assert.match(oneText, /Based on 1 review(?!s)/);
  assert.doesNotMatch(oneText, /Based on 1 reviews/);
  assert.ok(rowCounts(oneTree).includes("1 review"));
  assert.ok(rowCounts(oneTree).includes("0 reviews"));
});
