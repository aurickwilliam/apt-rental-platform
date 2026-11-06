import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import * as HeroUI from "@heroui/react";
import * as meterRules from "../../../packages/constants/src/apartment/electricity-meter.ts";
import { compile } from "./test-support/hook-runtime.mjs";
import {
  getOwnElectricityMeterError,
  OWN_ELECTRICITY_METER_ERROR,
  OWN_ELECTRICITY_METER_DETAIL,
} from "../../../packages/constants/src/apartment/electricity-meter.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("meter confirmation uses readable theme colors and a visible checkbox border", () => {
  const css = read("../app/globals.css");
  const rule = (selector) => {
    const start = css.indexOf(`${selector} {`);
    assert.notEqual(start, -1, `Missing scoped rule: ${selector}`);
    return css.slice(start, css.indexOf("}", start) + 1);
  };
  assert.match(rule('.electricity-meter-confirmation [data-slot="label"]'), /color: var\(--foreground\)/);
  assert.match(rule('.electricity-meter-confirmation [data-slot="description"]'), /color: var\(--muted-foreground\)/);
  assert.match(rule('.electricity-meter-confirmation [data-slot="field-error"]'), /color: var\(--destructive\)/);
  assert.match(rule('.electricity-meter-confirmation .checkbox__control'), /border: 1px solid var\(--muted-foreground\)/);
  assert.match(rule('.electricity-meter-confirmation .checkbox__control'), /background-color: var\(--card\)/);
  assert.match(rule('.electricity-meter-confirmation[data-selected="true"] .checkbox__control'), /background-color: var\(--primary\)/);
  assert.match(rule('.electricity-meter-confirmation:has(input:focus-visible) .checkbox__control'), /outline: 2px solid var\(--primary\)/);
});

test("installed HeroUI exposes a required labeled checkbox and its error", () => {
  const Component = compile("app/components/inputs/ElectricityMeterConfirmation.tsx", {
    "react/jsx-runtime": jsx, "@heroui/react": HeroUI, "@repo/constants": meterRules,
  }).default;
  const render = (isSelected, error) => renderToStaticMarkup(jsx.jsx(Component, { isSelected, error, onChange() {} }));
  const unchecked = render(false, OWN_ELECTRICITY_METER_ERROR);
  assert.match(unchecked, /type="checkbox"/);
  assert.match(unchecked, /<input[^>]*required=""/);
  assert.match(unchecked, /aria-invalid="true"/);
  assert.match(unchecked, /aria-describedby=/);
  assert.match(unchecked, /slot="errorMessage"/);
  assert.ok(unchecked.includes(OWN_ELECTRICITY_METER_ERROR));
  assert.doesNotMatch(unchecked, /\schecked="/);
  assert.match(render(true), /\schecked="/);
});

test("only explicit true confirms a dedicated meter", () => {
  assert.equal(getOwnElectricityMeterError(true), undefined);
  for (const value of [false, undefined, null, "true", 1, {}]) {
    assert.equal(getOwnElectricityMeterError(value), OWN_ELECTRICITY_METER_ERROR);
  }
  assert.equal(OWN_ELECTRICITY_METER_DETAIL, "Electricity: Own meter");
});

test("web creation starts unchecked, validates and submits the declaration", () => {
  const page = read("../app/landlord/properties/create/page.tsx");
  assert.match(page, /has_own_electricity_meter: false/);
  assert.match(page, /getOwnElectricityMeterError\(data.has_own_electricity_meter\)/);
  assert.match(page, /has_own_electricity_meter: formData.has_own_electricity_meter/);
  const info = read("../app/landlord/properties/create/components/Step2Info.tsx");
  assert.ok(info.indexOf("<ElectricityMeterConfirmation") > info.indexOf("<Label>Lease Duration</Label>"));
  assert.ok(info.indexOf("<ElectricityMeterConfirmation") < info.indexOf("{/* Address */}"));
});

test("web edits retain the declaration and prevent clearing it", () => {
  const edit = read("../app/landlord/properties/components/modals/EditPropertyModal.tsx");
  assert.match(edit, /getOwnElectricityMeterError\(form.has_own_electricity_meter\)/);
  assert.match(edit, /has_own_electricity_meter: form.has_own_electricity_meter/);
  assert.match(edit, /<ElectricityMeterConfirmation/);
});

test("web details and preview only label confirmed listings", () => {
  const detail = read("../app/browse/[apartmentId]/components/ApartmentDetailView.tsx");
  const preview = read("../app/landlord/properties/create/components/Step5Preview.tsx");
  assert.match(detail, /apartment.has_own_electricity_meter === true/);
  assert.match(detail, /\{OWN_ELECTRICITY_METER_DETAIL\}/);
  assert.match(preview, /formData.has_own_electricity_meter === true/);
  assert.match(preview, /label: OWN_ELECTRICITY_METER_DETAIL/);
});
