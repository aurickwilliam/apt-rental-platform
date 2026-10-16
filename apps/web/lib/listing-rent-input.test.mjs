import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(url) {
  return ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

const utils = { exports: {} };
vm.runInNewContext(compile(new URL("../../../packages/utils/src/apartmentPricing.ts", import.meta.url)), utils);
const component = compile(new URL("../app/landlord/properties/create/components/Step3Pricing.tsx", import.meta.url));

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const children = element.props?.children;
  return [element, ...(Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(nodes)];
}

test("rent preserves below-minimum values and shows shared FieldError after blur", () => {
  let blurred = false;
  let formData = { monthly_rent: Number.NaN, rent_due_day: Number.NaN, security_deposit_months: 0, advance_rent_months: 0, lease_agreement: null };
  const NumberField = Object.assign(() => {}, { Group: "Group", Input: "Input" });
  const Select = Object.assign(() => {}, { Trigger: "Trigger", Value: "Value", Indicator: "Indicator", Popover: "Popover" });
  const ListBox = Object.assign(() => {}, { Item: "Item" });
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useRef: () => ({ current: null }), useState: () => [blurred, value => { blurred = value; }] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { NumberField, Select, ListBox, Label: "Label", FieldError: "FieldError", Description: "Description", Button: "Button" },
    "@tabler/icons-react": { IconFileText: "File", IconUpload: "Upload", IconX: "X" },
    "@repo/utils": utils.exports,
  };
  const context = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(component, context);
  const render = (errors = {}) => context.exports.default({
    formData, errors,
    updateForm: updates => { formData = { ...formData, ...updates }; },
  });
  const rentField = (errors) => nodes(render(errors)).find(node => node.type === NumberField);
  const rentError = (errors) => nodes(rentField(errors)).find(node => node.type === "FieldError").props.children;
  const input = () => nodes(rentField()).find(node => node.type === "Input");

  assert.equal(rentError(), undefined, "untouched empty input has no immediate error");
  assert.equal(rentField().props.minValue, undefined, "NumberField must not clamp rent");
  rentField().props.onChange(500);
  assert.equal(formData.monthly_rent, 500);
  assert.equal(rentError(), undefined, "waits until blur before showing a local error");
  input().props.onBlur();
  assert.equal(rentField().props.value, 500, "blur leaves the entered amount unchanged");
  assert.equal(rentField().props.isInvalid, true);
  assert.equal(rentError(), "Monthly rent must be at least ₱1,000.");

  rentField().props.onChange(1000);
  assert.equal(rentField().props.isInvalid, false);
  assert.equal(rentError(), undefined, "correcting the amount clears the error");
  const summaryLabels = () => nodes(render()).filter(node => node.type === "span")
    .map(node => [node.props.children].flat().join(""));
  assert.ok(summaryLabels().includes("Monthly Rent"));
  assert.ok(!summaryLabels().includes("Monthly Rent (1 month)"));
  assert.ok(summaryLabels().includes("Security Deposit (0 months)"));
  assert.ok(summaryLabels().includes("Advance Rent (0 months)"));
  formData = { ...formData, security_deposit_months: 2, advance_rent_months: 1 };
  assert.ok(summaryLabels().includes("Security Deposit (2 months)"));
  assert.ok(summaryLabels().includes("Advance Rent (1 month)"));
  rentField().props.onChange(Number.NaN);
  assert.equal(rentField().props.isInvalid, true, "clearing a touched field remains invalid");
  assert.equal(rentError({ monthly_rent: "Continue validation error" }), "Continue validation error");
  assert.ok(utils.exports.validateApartmentPricing({ monthlyRent: 500, securityDepositMonths: 0, advanceRentMonths: 0, rentDueDay: 5 }).monthlyRent,
    "the shared Continue/submit rule still rejects below-minimum rent");
});
