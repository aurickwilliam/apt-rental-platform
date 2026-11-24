import { formatClockTime, formatDate, getMonthNames, getRelativeTime } from "./format";

const JANUARY_15 = new Date(2026, 0, 15, 14, 30, 0);

describe("formatDate", () => {
  test("keeps the existing English output", () => {
    expect(formatDate(JANUARY_15, "short", "en")).toBe("01/15/2026");
    expect(formatDate(JANUARY_15, "year", "en")).toBe("2026");
    expect(formatDate(JANUARY_15, "month", "en")).toBe("January");
  });

  test("uses Filipino month names", () => {
    expect(formatDate(JANUARY_15, "month", "fil")).toBe("Enero");
    expect(formatDate(new Date(2026, 11, 1), "month", "fil")).toBe("Disyembre");
  });

  test("defaults to English", () => {
    expect(formatDate(JANUARY_15, "month")).toBe("January");
  });

  test("returns an empty string for an invalid date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});

describe("formatClockTime", () => {
  test("renders a 12-hour clock in both languages", () => {
    expect(formatClockTime(JANUARY_15, "en")).toMatch(/2:30\s?PM/i);
    expect(formatClockTime(JANUARY_15, "fil")).toMatch(/2:30\s?PM/i);
  });
});

describe("getMonthNames", () => {
  test("has twelve entries per language", () => {
    expect(getMonthNames("en")).toHaveLength(12);
    expect(getMonthNames("fil")).toHaveLength(12);
    expect(getMonthNames("fil")[0]).toBe("Enero");
  });
});

describe("getRelativeTime", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("uses Filipino relative wording", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15, 14, 30, 0));

    expect(getRelativeTime(new Date(2026, 0, 15, 14, 29, 45), "fil")).toBe("kanina lang");
    expect(getRelativeTime(new Date(2026, 0, 15, 14, 25, 0), "fil")).toBe(
      "5 min ang nakalipas",
    );
    expect(getRelativeTime(new Date(2026, 0, 14, 9, 5, 0), "fil")).toBe("Kahapon, 9:05 AM");
  });

  test("keeps the English wording", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15, 14, 30, 0));

    expect(getRelativeTime(new Date(2026, 0, 15, 14, 29, 45), "en")).toBe("just now");
    expect(getRelativeTime(new Date(2026, 0, 15, 14, 25, 0), "en")).toBe("5 mins ago");
    expect(getRelativeTime(new Date(2026, 0, 15, 14, 0, 0), "en")).toMatch(/2:00\s?PM/i);
    expect(getRelativeTime(new Date(2026, 0, 14, 9, 5, 0), "en")).toBe("Yesterday, 9:05 AM");
  });
});
