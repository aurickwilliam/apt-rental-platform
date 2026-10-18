import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as dates from "@internationalized/date";

function calendarHarness(focusDate, highlightDate = focusDate) {
  const source = readFileSync(new URL("../app/tenant/my-rental/components/MiniCalendar.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const Calendar = Object.assign("Calendar", Object.fromEntries(
    ["Header", "Heading", "NavButton", "Grid", "GridHeader", "HeaderCell", "GridBody", "Cell"].map(name => [name, name]),
  ));
  const states = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = value; }];
    } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Calendar },
    "@internationalized/date": dates,
    "./DashboardCard": { default: "DashboardCard" },
  };
  const context = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(compiled, context);
  const nodes = element => !element || typeof element !== "object" ? [] :
    [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
  let tree;
  function render() {
    cursor = 0;
    tree = context.exports.default({ focusDate, highlightDate });
  }
  render();
  return {
    cell(date, { isToday = false, isOutsideMonth = false } = {}) {
      const cell = nodes(tree).find(node => node.type === "GridBody").props.children(dates.parseDate(date));
      assert.equal(cell.props.style.backgroundColor, "transparent", "HeroUI does not add an extra selected/today fill");
      return cell.props.children({ formattedDate: String(dates.parseDate(date).day), isToday, isOutsideMonth });
    },
    navigate(date) {
      nodes(tree).find(node => node.type === Calendar).props.onFocusChange(dates.parseDate(date));
      render();
    },
    text() { return nodes(tree).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ").replace(/\s+/g, " "); },
  };
}

test("rent calendar uses a black outline for today, blue month end and orange rent due", () => {
  const calendar = calendarHarness(new Date(2026, 10, 5));
  const today = calendar.cell("2026-11-18", { isToday: true });
  assert.match(today.props.className, /border-black/);
  assert.doesNotMatch(today.props.className, /bg-primary|bg-orange/);
  assert.match(calendar.cell("2026-11-30").props.className, /bg-primary text-white/);
  assert.match(calendar.cell("2026-11-05").props.className, /bg-orange-500 text-white/);
  assert.match(calendar.text(), /Nov 30 — Month end/);
});

test("month navigation keeps the marker and legend synchronized for every month length", () => {
  const calendar = calendarHarness(new Date(2026, 10, 5));
  for (const [focus, end, label] of [
    ["2026-12-05", "2026-12-31", "Dec 31"],
    ["2027-02-05", "2027-02-28", "Feb 28"],
    ["2028-02-05", "2028-02-29", "Feb 29"],
  ]) {
    calendar.navigate(focus);
    assert.match(calendar.cell(end).props.className, /bg-primary text-white/);
    assert.ok(calendar.text().includes(`${label} — Month end`));
  }
  assert.doesNotMatch(calendar.cell("2028-01-31", { isOutsideMonth: true }).props.className, /bg-primary/);
});

test("overlapping dates retain today's border, rent due fill and month end dot", () => {
  const calendar = calendarHarness(new Date(2026, 10, 30));
  const cell = calendar.cell("2026-11-30", { isToday: true });
  assert.match(cell.props.className, /border-black/);
  assert.match(cell.props.className, /bg-orange-500 text-white/);
  assert.equal(cell.props.children[1].props["aria-label"], "Month end");
  assert.match(cell.props.children[1].props.className, /bg-primary/);
});
