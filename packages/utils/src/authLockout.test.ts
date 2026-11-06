import {
  formatLockoutClock,
  formatLockoutWait,
  lockoutDescription,
  lockoutKeyHash,
  lockoutReminderFor,
  lockoutReminderSecondsLeft,
  parseLockoutReminder,
} from "./authLockout";

describe("lockout wording", () => {
  it("rounds the wait up to whole minutes", () => {
    expect(formatLockoutWait(1)).toBe("1 minute");
    expect(formatLockoutWait(60)).toBe("1 minute");
    expect(formatLockoutWait(61)).toBe("2 minutes");
    expect(formatLockoutWait(900)).toBe("15 minutes");
  });

  it("formats a live clock", () => {
    expect(formatLockoutClock(899)).toBe("14:59");
    expect(formatLockoutClock(5)).toBe("0:05");
    expect(formatLockoutClock(-3)).toBe("0:00");
  });

  it("states the limit and the wait", () => {
    expect(lockoutDescription(900)).toBe(
      "You've reached the limit of 5 attempts. For your security, please try again in about 15 minutes.",
    );
  });

  it("keys by email without keeping it, ignoring case and spaces", () => {
    expect(lockoutKeyHash(" Ana@Example.com ")).toBe(lockoutKeyHash("ana@example.com"));
    expect(lockoutKeyHash("ana@example.com")).not.toBe(lockoutKeyHash("bo@example.com"));
    expect(lockoutKeyHash("ana@example.com")).not.toContain("ana");
  });
});

describe("lockout reminder", () => {
  const start = 1_000_000;

  it("counts down the seconds the server reported", () => {
    const reminder = lockoutReminderFor(420, start);
    expect(lockoutReminderSecondsLeft(reminder, start)).toBe(420);
    expect(lockoutReminderSecondsLeft(reminder, start + 100_500)).toBe(320);
  });

  it("is over when the time is up or there is none", () => {
    const reminder = lockoutReminderFor(60, start);
    expect(lockoutReminderSecondsLeft(reminder, start + 60_000)).toBe(0);
    expect(lockoutReminderSecondsLeft(reminder, start + 61_000)).toBe(0);
    expect(lockoutReminderSecondsLeft(null, start)).toBe(0);
  });

  it("ignores unreadable stored values", () => {
    expect(parseLockoutReminder(null)).toBeNull();
    expect(parseLockoutReminder("{oops")).toBeNull();
    expect(parseLockoutReminder('{"until":"soon"}')).toBeNull();
    expect(parseLockoutReminder('{"failures":5,"windowStartedAt":10}')).toBeNull();
    expect(parseLockoutReminder('{"until":1234}')).toEqual({ until: 1234 });
  });
});
