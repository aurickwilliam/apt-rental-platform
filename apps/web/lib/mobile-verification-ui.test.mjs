import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { VALID_IDS, SECONDARY_IDS } from "../../../packages/constants/src/user/valid-ids.ts";

function load(file, dependencies = {}) {
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const mocks = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": {
      Button: "Button", Label: "Label", RadioGroup: "RadioGroup",
      Radio: Object.assign(() => {}, { Content: "Content", Control: "Control", Indicator: "Indicator" }),
    },
    "@repo/constants": { VALID_IDS, SECONDARY_IDS },
    ...dependencies,
  };
  const source = readFileSync(new URL(`../app/verify/mobile/components/${file}.tsx`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => { assert.ok(mocks[name], name); return mocks[name]; },
  });
  return exports.default;
}
function nodes(tree) { return tree && typeof tree === "object" ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : []; }

test("mobile ID radio rows preserve the complete existing supported list and selected value", () => {
  const Selector = load("VerificationIdSelector");
  const choices = [];
  const tree = Selector({ value: "Passport", onChange: value => choices.push(value) });
  assert.equal(tree.type, "RadioGroup");
  assert.equal(tree.props["aria-label"], "Supported ID types");
  assert.equal(tree.props.value, "Passport");
  assert.deepEqual(nodes(tree).filter(node => node.props?.value).map(node => node.props.value).slice(1), [...VALID_IDS, ...SECONDARY_IDS]);
  tree.props.onChange("Passport");
  assert.deepEqual(choices, ["Passport"]);
});

test("mobile navigation keeps Continue disabled until ready and locks both actions while submitting", () => {
  const Navigation = load("MobileVerificationNavigation");
  const callbacks = { onBack() {}, onContinue() {} };
  for (const pending of [false, true]) {
    const buttons = nodes(Navigation({ ...callbacks, isDisabled: true, isPending: pending })).filter(node => node.type === "Button");
    assert.equal(buttons[0].props.children, "Back");
    assert.equal(buttons[0].props.isDisabled, pending);
    assert.equal(buttons[1].props.children, "Continue");
    assert.equal(buttons[1].props.isDisabled, true);
  }
});

test("returning to a captured photo offers preview/Continue without restarting the camera", () => {
  const Photo = load("MobileVerificationPhotoStep", {
    "@tabler/icons-react": { IconCircleCheck: "Check" },
    "./CameraCapture": { default: "Camera" },
    "./MobileVerificationNavigation": { default: "Navigation" },
  });
  const props = { capture: { url: "blob:captured-frame" }, label: "ID front", facing: "environment", guide: "Capture your ID", onCapture() {}, onRetake() {}, onBack() {}, onContinue() {} };
  const tree = Photo(props);
  assert.equal(nodes(tree).filter(node => node.type === "Camera").length, 0);
  assert.equal(nodes(tree).find(node => node.type === "img").props.src, "blob:captured-frame");
  assert.equal(nodes(tree).find(node => node.type === "Navigation").props.onContinue, props.onContinue);
  assert.equal(Photo({ ...props, capture: null }).type, "Camera");
});

test("mobile layout is route-scoped, uses safe areas and sticky rather than fixed controls", () => {
  const css = readFileSync(new URL("../app/verify/mobile/verification.css", import.meta.url), "utf8");
  assert.match(css, /position: sticky/);
  assert.doesNotMatch(css, /position: fixed/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /safe-area-inset-left/);
  assert.match(css, /min-height: 2\.75rem/);
  assert.match(css, /white-space: normal/);
});
