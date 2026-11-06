import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as preferences from "./tenant-preferences.ts";

const jsx = (type, props) => ({ type, props });
const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Slider = compound("Slider", ["Output", "Track", "Fill", "Thumb"]);
const InputGroup = compound("InputGroup", ["Prefix", "Input"]);
const source = readFileSync(new URL("../app/components/preferences/BudgetRangeField.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(layout = "cards", initial = {}) {
  const state = [];
  let cursor = 0;
  let range = [initial.min ?? 5000, initial.max ?? 100000];
  const ref = {};
  const dependencies = {
    react: {
      forwardRef: render => render,
      useState: initialValue => {
        const index = cursor++;
        if (!(index in state)) state[index] = initialValue;
        return [state[index], value => { state[index] = value; }];
      },
      useImperativeHandle: (target, create) => { target.current = create(); },
    },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@heroui/react": { Slider, InputGroup, Label: "Label", Button: "Button" },
    "@tabler/icons-react": { IconCheck: "IconCheck" },
    "@/lib/tenant-preferences": preferences,
    "../settings/SettingsSelect": { default: "SettingsSelect" },
  };
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  const render = () => {
    cursor = 0;
    return context.exports.default({
      budgetMin: range[0], budgetMax: range[1], layout,
      resolveInitialSelection: initial.saved ?? false,
      onRangeChange: (min, max) => { range = [min, max]; },
    }, ref);
  };
  return { render, ref, range: () => range };
}

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
const find = (tree, type) => nodes(tree).find(node => node.type === type);
const inputs = tree => nodes(tree).filter(node => node.type === InputGroup.Input);
const customCard = tree => nodes(tree).find(node => node.props?.label === "Custom range");

test("onboarding reveals a two-handle HeroUI slider, not typing inputs, only after Custom range is selected", () => {
  const app = harness();
  assert.equal(find(app.render(), Slider), undefined);
  customCard(app.render()).props.onPress();
  const tree = app.render();
  const slider = find(tree, Slider);
  assert.equal(slider.props.minValue, preferences.PREFERENCE_BUDGET_MIN);
  assert.equal(slider.props.maxValue, preferences.PREFERENCE_BUDGET_MAX);
  assert.equal(slider.props.step, preferences.PREFERENCE_BUDGET_STEP);
  assert.deepEqual(Array.from(slider.props.value), [5000, 100000]);
  assert.equal(inputs(tree).length, 0);
  assert.deepEqual(nodes(tree).filter(node => node.type === Slider.Thumb).map(node => node.props["aria-label"]), ["Minimum monthly rent", "Maximum monthly rent"]);
  slider.props.onChange([10000, 35000]);
  assert.deepEqual(app.range(), [10000, 35000]);
  assert.equal(find(app.render(), Slider.Output).props.children(), "₱10,000 – ₱35,000");
  customCard(app.render()).props.onPress();
  assert.equal(find(app.render(), Slider), undefined);
  assert.deepEqual(app.range(), [5000, 100000]);
});

test("Settings slider and typing boxes stay synchronized, clearing obsolete drafts and errors", () => {
  const app = harness("compact", { min: 8000, max: 25000, saved: true });
  assert.equal(inputs(app.render()).length, 2);
  inputs(app.render())[0].props.onChange({ target: { value: "12,400" } });
  app.render();
  assert.equal(app.ref.current.commit(), true);
  assert.deepEqual(app.range(), [12000, 25000]);
  assert.deepEqual(Array.from(find(app.render(), Slider).props.value), [12000, 25000]);
  inputs(app.render())[1].props.onChange({ target: { value: "invalid" } });
  app.render();
  assert.equal(app.ref.current.commit(), false);
  find(app.render(), Slider).props.onChange([15000, 40000]);
  const tree = app.render();
  assert.deepEqual(app.range(), [15000, 40000]);
  assert.deepEqual(inputs(tree).map(node => node.props.value), ["15,000", "40,000"]);
  assert.equal(nodes(tree).some(node => node.props?.role === "alert"), false);
  assert.equal(app.ref.current.commit(), true);
});

test("switching from a preset to custom preserves its exact stored values until the slider moves", () => {
  const app = harness("compact", { min: 5000, max: 14999, saved: true });
  assert.equal(find(app.render(), Slider), undefined);
  find(app.render(), "SettingsSelect").props.onChange("custom");
  assert.deepEqual(Array.from(find(app.render(), Slider).props.value), [5000, 14999]);
  assert.deepEqual(app.range(), [5000, 14999]);
});
