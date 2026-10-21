import type { ExpenseRecord } from "@repo/utils";

const CSV_HEADER = [
  "Paid",
  "Property",
  "Category",
  "Treatment",
  "Description",
  "Amount",
] as const;

/** Spreadsheet apps run cells that start with these as formulas. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function csvCell(value: string): string {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * The loaded expense rows as CSV, exactly as shown: no totals and no figures
 * the report did not already produce. `categoryLabel` and `propertyName` keep
 * the file readable without this module knowing the finance catalogue.
 */
export function expensesToCsv(
  rows: readonly ExpenseRecord[],
  labels: {
    category: (id: string) => string;
    property: (id: string) => string;
  },
): string {
  const lines = rows.map((expense) =>
    [
      expense.spent_on,
      labels.property(expense.apartment_id),
      labels.category(expense.category),
      expense.treatment === "capital" ? "Improvement / replacement" : "Operating",
      expense.description,
      // A number stays a number; the formula guard applies to text only.
      expense.amount.toFixed(2),
    ]
      .map((cell, index) =>
        index === CSV_HEADER.length - 1 ? cell : csvCell(cell),
      )
      .join(","),
  );
  // A byte-order mark keeps non-ASCII property names intact in Excel.
  return `﻿${[CSV_HEADER.join(","), ...lines].join("\r\n")}\r\n`;
}

/** `expenses-2026-10-all-properties.csv`, safe for any file system. */
export function expensesCsvFilename(month: string, propertyName: string | null) {
  const slug = (propertyName ?? "all-properties")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `expenses-${month}-${slug || "property"}.csv`;
}

/** Hands the file to the browser's download flow; client-side only. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
