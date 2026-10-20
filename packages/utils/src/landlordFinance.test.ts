import fc from "fast-check";
import {
  budgetCategoryOptions, budgetKindFromParam, budgetProgress, financeAfterReserve,
  financeCategoryFromParam, financeIncome, financeMonthFromParam,
  groupBudgetsByCategory, isBudgetCategoryAllowed, manilaToday, parseFinanceAmount,
  rentAgeBucket, shiftFinanceMonth, suggestFinanceBudget, validateExpenseDate,
} from "./landlordFinance";

describe("landlord finance rules", () => {
  test("Manila dates are independent of the device timezone", () => {
    expect(manilaToday(new Date("2026-10-16T16:30:00Z"))).toBe("2026-10-17");
    expect(shiftFinanceMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftFinanceMonth("2026-12", 1)).toBe("2027-01");
  });
  test("route months outside the report window fall back to the current month", () => {
    expect(financeMonthFromParam("2026-09", "2026-10")).toBe("2026-09");
    expect(financeMonthFromParam("2024-11", "2026-10")).toBe("2024-11");
    expect(financeMonthFromParam("2024-10", "2026-10")).toBe("2026-10");
    expect(financeMonthFromParam("2027-01", "2026-10")).toBe("2026-10");
    expect(financeMonthFromParam("2026-13", "2026-10")).toBe("2026-10");
    expect(financeMonthFromParam(undefined, "2026-10")).toBe("2026-10");
  });
  test("budget route params only accept known categories and kinds", () => {
    expect(financeCategoryFromParam("insurance")).toBe("insurance");
    expect(financeCategoryFromParam("emergency")).toBe("emergency");
    expect(financeCategoryFromParam("unknown")).toBeUndefined();
    expect(financeCategoryFromParam(["insurance"])).toBeUndefined();
    expect(financeCategoryFromParam(undefined)).toBeUndefined();
    expect(budgetKindFromParam("reserve")).toBe("reserve");
    expect(budgetKindFromParam("expense")).toBe("expense");
    expect(budgetKindFromParam("savings")).toBeUndefined();
    expect(budgetKindFromParam(undefined)).toBeUndefined();
  });
  test("spending budgets exclude reserve-only categories while reserves keep every category", () => {
    expect(isBudgetCategoryAllowed("expense", "maintenance")).toBe(true);
    expect(isBudgetCategoryAllowed("expense", "emergency")).toBe(false);
    expect(isBudgetCategoryAllowed("expense", "vacancy")).toBe(false);
    expect(isBudgetCategoryAllowed("reserve", "emergency")).toBe(true);
    expect(isBudgetCategoryAllowed("reserve", "vacancy")).toBe(true);
    expect(budgetCategoryOptions("expense").map((item) => item.id)).not.toContain("emergency");
    expect(budgetCategoryOptions("reserve").map((item) => item.id)).toContain("emergency");
  });
  test.each(["", "NaN", "Infinity", "1e3", "-2", "1.234", "1,000", "9999999999", "0"])("rejects invalid expense amount %s", (value) => {
    expect(parseFinanceAmount(value)).toBeNull();
  });
  test("zero budgets are valid and decimals are not silently truncated", () => {
    expect(parseFinanceAmount("0", true)).toBe(0);
    expect(parseFinanceAmount("1200.25")).toBe(1200.25);
    expect(parseFinanceAmount("999999999.99")).toBe(999999999.99);
  });
  test("dates reject invalid days, old dates and future spending", () => {
    expect(validateExpenseDate("2026-02-30", "2026-10-17")).toBeTruthy();
    expect(validateExpenseDate("2026-10-18", "2026-10-17")).toBeTruthy();
    expect(validateExpenseDate("1999-12-31", "2026-10-17")).toBeTruthy();
    expect(validateExpenseDate("2024-02-29", "2026-10-17")).toBeNull();
  });
  test("missing records never become zero expenses", () => {
    const month = { month: "2026-10", collected: 50000, operating: 0, capital: 0, reviewed: false };
    expect(financeIncome(month)).toBeNull();
    expect(financeAfterReserve(month, 5000)).toBeNull();
    expect(financeIncome({ ...month, reviewed: true })).toBe(50000);
  });
  test("capital spending and reserves are separate from operating income", () => {
    const month = { month: "2026-10", collected: 50000, operating: 11500, capital: 3000, reviewed: true };
    expect(financeIncome(month)).toBe(38500);
    expect(financeAfterReserve(month, 7500)).toBe(28000);
    expect(financeIncome({ ...month, operating: 60000 })).toBe(-10000);
  });
  test("known insurance premium gives a transparent monthly allocation", () => {
    expect(suggestFinanceBudget({ category: "insurance", kind: "reserve", target_amount: 12000, months_remaining: 12 })?.amount).toBe(1000);
    expect(suggestFinanceBudget({ category: "maintenance", kind: "expense", target_amount: null, months_remaining: null })).toBeNull();
    expect(suggestFinanceBudget({ category: "maintenance", kind: "expense", target_amount: null, months_remaining: null }, [1000, 2000, 3000])?.amount).toBe(2000);
  });
  test("suggestions round up to fully fund the entered goal", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 1000000 }), fc.integer({ min: 1, max: 600 }), (target, months) => {
      const result = suggestFinanceBudget({ category: "furniture", kind: "reserve", target_amount: target, months_remaining: months });
      expect(result!.amount * months + 0.00001).toBeGreaterThanOrEqual(target);
    }));
  });
  test("overdue age buckets have clear boundaries", () => {
    expect([0, 1, 7, 8, 30, 31].map(rentAgeBucket)).toEqual(["not_due", "1–7 days", "1–7 days", "8–30 days", "8–30 days", "31+ days"]);
  });
  test("budgets collapse into one row per category with their totals", () => {
    const groups = groupBudgetsByCategory([
      { id: "b1", apartment_id: "villa", month: "2026-10-01", category: "utilities", kind: "expense", amount: 3000, spent: 1200, target_amount: null, months_remaining: null },
      { id: "b2", apartment_id: "studio", month: "2026-10-01", category: "maintenance", kind: "expense", amount: 5000, spent: 6000, target_amount: null, months_remaining: null },
      { id: "b3", apartment_id: "villa", month: "2026-10-01", category: "maintenance", kind: "expense", amount: 2500, spent: 500, target_amount: null, months_remaining: null },
      { id: "b4", apartment_id: "villa", month: "2026-10-01", category: "maintenance", kind: "reserve", amount: 1000, spent: 0, target_amount: 12000, months_remaining: 12 },
    ]);
    // Categories follow FINANCE_CATEGORIES, and a reserve never merges into the
    // spending budget that shares its category.
    expect(groups.map((group) => [group.category, group.kind, group.amount, group.spent])).toEqual([
      ["maintenance", "expense", 7500, 6500],
      ["maintenance", "reserve", 1000, 0],
      ["utilities", "expense", 3000, 1200],
    ]);
    expect(groups[0].entries.map((entry) => entry.apartmentId)).toEqual(["studio", "villa"]);
    expect(groups[1].entries[0]).toEqual({ budgetId: "b4", apartmentId: "villa", amount: 1000, spent: 0, target_amount: 12000, months_remaining: 12 });
  });
  test("budget progress flags overspending and never divides by a zero limit", () => {
    expect(budgetProgress(3000, 4200)).toEqual({ over: true, percent: 140, difference: 1200, barWidth: 100 });
    expect(budgetProgress(3000, 1200)).toEqual({ over: false, percent: 40, difference: 1800, barWidth: 40 });
    expect(budgetProgress(0, 0)).toEqual({ over: false, percent: null, difference: 0, barWidth: 0 });
    expect(budgetProgress(0, 500)).toEqual({ over: true, percent: null, difference: 500, barWidth: 100 });
  });
});
