import assert from "node:assert/strict";
import { test } from "node:test";

import {
  expensesCsvFilename,
  expensesToCsv,
} from "./landlord-finance-export.ts";

const labels = {
  category: (id) => (id === "maintenance" ? "Maintenance & repairs" : id),
  property: (id) => (id === "a" ? 'Bayview "North"' : "Canal House"),
};
const expense = (overrides) => ({
  id: "1",
  apartment_id: "a",
  category: "maintenance",
  treatment: "operating",
  amount: 4200,
  spent_on: "2026-10-12",
  description: "Turnover repaint",
  ...overrides,
});

test("writes a header and one line per loaded row", () => {
  const csv = expensesToCsv([expense({})], labels);
  assert.equal(
    csv,
    '﻿Paid,Property,Category,Treatment,Description,Amount\r\n2026-10-12,"Bayview ""North""",Maintenance & repairs,Operating,Turnover repaint,4200.00\r\n',
  );
});

test("an empty list still exports the header", () => {
  assert.equal(
    expensesToCsv([], labels),
    "﻿Paid,Property,Category,Treatment,Description,Amount\r\n",
  );
});

test("quotes commas and newlines and labels improvements", () => {
  const csv = expensesToCsv(
    [expense({ treatment: "capital", description: "Paint,\nrepair" })],
    labels,
  );
  assert.match(csv, /Improvement \/ replacement,"Paint,\nrepair",4200\.00/);
});

test("neutralizes spreadsheet formulas in text cells", () => {
  const csv = expensesToCsv(
    [expense({ description: '=HYPERLINK("http://example.test")' })],
    labels,
  );
  assert.ok(csv.includes(`"'=HYPERLINK(""http://example.test"")"`));
});

test("filenames carry the month and a safe property slug", () => {
  assert.equal(
    expensesCsvFilename("2026-10", null),
    "expenses-2026-10-all-properties.csv",
  );
  assert.equal(
    expensesCsvFilename("2026-10", "Canal House #2 / Annex"),
    "expenses-2026-10-canal-house-2-annex.csv",
  );
});
