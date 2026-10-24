import { calculateAge, validateBirthDate } from "./birthDate";

const isoYearsAgo = (years: number, dayOffset = 0): string => {
  const today = new Date();
  const date = new Date(today.getFullYear() - years, today.getMonth(), today.getDate() + dayOffset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

describe("validateBirthDate", () => {
  it("accepts exactly 18 and exactly 120", () => {
    expect(validateBirthDate(isoYearsAgo(18))).toBeNull();
    expect(validateBirthDate(isoYearsAgo(120))).toBeNull();
  });

  it("rejects someone turning 18 tomorrow", () => {
    expect(validateBirthDate(isoYearsAgo(18, 1))).toBe("You must be at least 18 years old");
  });

  it("rejects future, over-120 and empty or malformed dates", () => {
    expect(validateBirthDate(isoYearsAgo(-1))).toBe("Date of birth cannot be in the future");
    expect(validateBirthDate(isoYearsAgo(121))).toBe("Please enter a valid date of birth");
    expect(validateBirthDate("")).toBe("Please enter a valid date of birth");
    expect(validateBirthDate("not-a-date")).toBe("Please enter a valid date of birth");
  });
});

describe("calculateAge", () => {
  it("counts a birthday that has not happened yet this year", () => {
    expect(calculateAge(new Date(2000, 11, 31), new Date(2020, 0, 1))).toBe(19);
    expect(calculateAge(new Date(2000, 0, 1), new Date(2020, 0, 1))).toBe(20);
  });
});
