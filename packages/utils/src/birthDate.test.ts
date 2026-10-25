import { BIRTH_DATE_ERRORS, calculateAge, fromBirthDateValue, getBirthDateRange, getManilaDate, toBirthDateValue, validateBirthDate } from "./birthDate";

describe("validateBirthDate", () => {
  const now = new Date("2026-10-25T04:00:00Z");
  it("accepts exactly 18 and exactly 110 and rejects one day outside either bound", () => {
    expect(validateBirthDate("2008-10-25", now)).toBeNull();
    expect(validateBirthDate("1916-10-25", now)).toBeNull();
    expect(validateBirthDate("2008-10-26", now)).toBe(BIRTH_DATE_ERRORS.underage);
    expect(validateBirthDate("1916-10-24", now)).toBe(BIRTH_DATE_ERRORS.invalid);
  });

  it("rejects someone turning 18 tomorrow", () => {
    expect(validateBirthDate("2008-10-26", now)).toBe(BIRTH_DATE_ERRORS.underage);
  });

  it("rejects future, over-110 and empty or malformed dates", () => {
    expect(validateBirthDate("2026-10-26", now)).toBe(BIRTH_DATE_ERRORS.future);
    expect(validateBirthDate("1915-10-25", now)).toBe(BIRTH_DATE_ERRORS.invalid);
    expect(validateBirthDate("", now)).toBe(BIRTH_DATE_ERRORS.required);
    expect(validateBirthDate("not-a-date", now)).toBe(BIRTH_DATE_ERRORS.invalid);
  });

  it("rejects impossible calendar dates instead of accepting Date's rollover", () => {
    for (const value of ["2000-02-31", "2001-02-29", "2000-04-31", "2000-13-01", "2000-1-01"]) {
      expect(validateBirthDate(value, now)).toBe(BIRTH_DATE_ERRORS.invalid);
    }
    expect(validateBirthDate("2000-02-29", now)).toBeNull();
  });
  it("changes the range at Manila midnight and clamps leap-day anniversaries", () => {
    expect(getManilaDate(new Date("2026-10-24T15:59:59Z"))).toBe("2026-10-24");
    expect(getManilaDate(new Date("2026-10-24T16:00:00Z"))).toBe("2026-10-25");
    expect(getBirthDateRange("2024-02-29")).toEqual({ earliest: "1914-02-28", latest: "2006-02-28" });
    expect(validateBirthDate("2008-02-29", new Date("2026-02-28T12:00:00+08:00"))).toBe(BIRTH_DATE_ERRORS.underage);
    expect(validateBirthDate("2008-02-29", new Date("2026-03-01T12:00:00+08:00"))).toBeNull();
  });
});

describe("calculateAge", () => {
  it("counts a birthday that has not happened yet this year", () => {
    expect(calculateAge(new Date(2000, 11, 31), new Date(2020, 0, 1))).toBe(19);
    expect(calculateAge(new Date(2000, 0, 1), new Date(2020, 0, 1))).toBe(20);
  });
});

describe("toBirthDateValue / fromBirthDateValue", () => {
  it("keeps the local calendar day whatever the time of day", () => {
    expect(toBirthDateValue(new Date(2000, 0, 5, 0, 30))).toBe("2000-01-05");
    expect(toBirthDateValue(new Date(2000, 0, 5, 23, 59))).toBe("2000-01-05");
  });

  it("pads month and day", () => {
    expect(toBirthDateValue(new Date(1999, 8, 3))).toBe("1999-09-03");
  });

  it("round-trips a stored value", () => {
    const parsed = fromBirthDateValue("2000-01-05");
    expect(parsed && toBirthDateValue(parsed)).toBe("2000-01-05");
  });

  it("returns null for empty or invalid values", () => {
    expect(fromBirthDateValue("")).toBeNull();
    expect(fromBirthDateValue(null)).toBeNull();
    expect(fromBirthDateValue("not-a-date")).toBeNull();
  });
});
