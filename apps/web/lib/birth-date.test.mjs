import assert from "node:assert/strict";
import { test } from "node:test";
import { validateBirthDate, calculateAge } from "./birth-date.ts";

function isoYearsAgo(years, monthOffset = 0, dayOffset = 0) {
  const today = new Date();
  const d = new Date(today.getFullYear() - years, today.getMonth() + monthOffset, today.getDate() + dayOffset);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test("exactly 18 today passes", () => {
  assert.equal(validateBirthDate(isoYearsAgo(18)), null);
});

test("turning 18 tomorrow fails as under 18", () => {
  assert.equal(
    validateBirthDate(isoYearsAgo(18, 0, 1)),
    "You must be at least 18 years old",
  );
});

test("17 years old fails as under 18", () => {
  assert.equal(
    validateBirthDate(isoYearsAgo(17)),
    "You must be at least 18 years old",
  );
});

test("1902 (age ~124) fails as too old", () => {
  assert.equal(
    validateBirthDate("1902-06-22"),
    "Please enter a valid date of birth",
  );
});

test("exactly 120 passes (cap boundary)", () => {
  assert.equal(validateBirthDate(isoYearsAgo(120)), null);
});

test("121 fails as too old (cap boundary)", () => {
  assert.equal(
    validateBirthDate(isoYearsAgo(121)),
    "Please enter a valid date of birth",
  );
});

test("future date fails", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  assert.equal(
    validateBirthDate(iso),
    "Date of birth cannot be in the future",
  );
});

test("a normal 25-year-old passes", () => {
  assert.equal(validateBirthDate(isoYearsAgo(25)), null);
});

test("invalid input fails", () => {
  assert.equal(validateBirthDate("not-a-date"), "Please enter a valid date of birth");
  assert.equal(validateBirthDate(""), "Please enter a valid date of birth");
});

test("Feb 29 birthday counts as occurred from Mar 1 on non-leap years", () => {
  // 2008-02-29 -> turns 18 on 2026-03-01, still 17 on 2026-02-28.
  assert.equal(calculateAge(new Date(2008, 1, 29), new Date(2026, 1, 28)), 17);
  assert.equal(calculateAge(new Date(2008, 1, 29), new Date(2026, 2, 1)), 18);
});
