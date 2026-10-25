import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { BIRTH_DATE_ERRORS as errors, MINIMUM_AGE, MAXIMUM_AGE, calculateAge, getBirthDateDatabaseError, getBirthDateRange, getManilaDate, validateBirthDate } from "./birth-date.ts";

const now = new Date("2026-10-25T04:00:00Z");

test("inclusive Manila anniversaries enforce exactly 18–110, including one-day boundaries", () => {
  assert.equal(MINIMUM_AGE, 18); assert.equal(MAXIMUM_AGE, 110);
  assert.deepEqual(getBirthDateRange(getManilaDate(now)), { earliest: "1916-10-25", latest: "2008-10-25" });
  assert.equal(validateBirthDate("2008-10-25", now), null);
  assert.equal(validateBirthDate("2008-10-26", now), errors.underage);
  assert.equal(validateBirthDate("1916-10-25", now), null);
  assert.equal(validateBirthDate("1916-10-24", now), errors.invalid);
  assert.equal(validateBirthDate("1915-10-25", now), errors.invalid);
  assert.equal(validateBirthDate("1901-12-13", now), errors.invalid);
});

test("required, malformed, impossible and future values have distinct canonical messages", () => {
  for (const value of [undefined, null, ""]) assert.equal(validateBirthDate(value, now), errors.required);
  for (const value of ["not-a-date", "2000-02-31", "2001-02-29", "2000-04-31", "2000-13-01", "2000-00-01", "2000-1-01", "2000-01-00", "2000-01-01T00:00:00Z"]) {
    assert.equal(validateBirthDate(value, now), errors.invalid, value);
  }
  assert.equal(validateBirthDate("2026-10-26", now), errors.future);
  assert.equal(validateBirthDate("2000-01-01", now), null);
});

test("leap birthdays use real Gregorian dates and non-leap-year anniversary evaluation", () => {
  assert.equal(validateBirthDate("2008-02-29", new Date("2026-02-28T04:00:00Z")), errors.underage);
  assert.equal(validateBirthDate("2008-02-29", new Date("2026-03-01T04:00:00Z")), null);
  assert.equal(validateBirthDate("2000-02-29", now), null);
  assert.equal(validateBirthDate("1900-02-29", now), errors.invalid);
  assert.deepEqual(getBirthDateRange("2024-02-29"), { earliest: "1914-02-28", latest: "2006-02-28" });
  assert.equal(validateBirthDate("1914-02-28", new Date("2024-02-29T04:00:00Z")), null);
  assert.equal(validateBirthDate("1914-02-27", new Date("2024-02-29T04:00:00Z")), errors.invalid);
});

test("Manila midnight changes both ends of the accepted range, independent of UTC day", () => {
  const before = new Date("2026-10-24T15:59:59.999Z"), after = new Date("2026-10-24T16:00:00.000Z");
  assert.equal(getManilaDate(before), "2026-10-24"); assert.equal(getManilaDate(after), "2026-10-25");
  assert.equal(validateBirthDate("2008-10-25", before), errors.underage);
  assert.equal(validateBirthDate("2008-10-25", after), null);
  assert.equal(validateBirthDate("1916-10-24", before), null);
  assert.equal(validateBirthDate("1916-10-24", after), errors.invalid);
});

test("changing the host timezone cannot change registration results", () => {
  const moduleUrl = new URL("./birth-date.ts", import.meta.url).href;
  const script = `import {getManilaDate,getBirthDateRange,validateBirthDate} from ${JSON.stringify(moduleUrl)};
    const now = new Date('2026-10-24T16:00:00Z'); console.log(JSON.stringify([getManilaDate(now),getBirthDateRange(getManilaDate(now)),validateBirthDate('2008-10-25', now),validateBirthDate('1916-10-24',now)]));`;
  const results = ["UTC", "America/Los_Angeles", "Asia/Tokyo", "Asia/Manila"].map(TZ => {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { encoding: "utf8", env: { ...process.env, TZ } });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  });
  assert.equal(new Set(results).size, 1);
});

test("only exact known database guard exceptions map back to the birth-date field", () => {
  assert.equal(getBirthDateDatabaseError({ code: "P0001", message: "You must be at least 18 years old." }), errors.underage);
  assert.equal(getBirthDateDatabaseError({ code: "P0001", message: "Date of birth cannot be in the future." }), errors.future);
  assert.equal(getBirthDateDatabaseError({ code: "P0001", message: "Please enter a valid date of birth." }), errors.invalid);
  for (const error of [{ code: "P0001", message: "Permission denied" }, { code: "503", message: "Please enter a valid date of birth." }, { code: "P0001", message: "Transport failed: Please enter a valid date of birth." }]) {
    assert.equal(getBirthDateDatabaseError(error), null);
  }
});

test("explicit calendar-age helper still handles month/day and Feb 29 birthdays", () => {
  assert.equal(calculateAge(new Date(2000, 11, 31), new Date(2020, 0, 1)), 19);
  assert.equal(calculateAge(new Date(2008, 1, 29), new Date(2026, 1, 28)), 17);
  assert.equal(calculateAge(new Date(2008, 1, 29), new Date(2026, 2, 1)), 18);
});
