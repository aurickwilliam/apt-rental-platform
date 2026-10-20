import assert from "node:assert/strict";
import { test } from "node:test";

import {
  budgetCategoryOptions,
  budgetProgress,
  decodeFinanceReport,
  financeAfterReserve,
  financeBudgetMonthsDefault,
  financeCategoryTreatmentDefault,
  financeComparisonSentence,
  financeErrorMessage,
  financeExpenseDateDefault,
  financeExpensePage,
  financeGoalFromForm,
  financeIncome,
  financeIncomeMonthsFromReports,
  financeLedgerPage,
  financeMonthFromParam,
  groupBudgetsByCategory,
  parseFinanceAmount,
  rankFinanceProperties,
  rentAgeBucket,
  suggestFinanceBudget,
  validateExpenseDate,
} from "../../../packages/utils/src/landlordFinance.ts";
import { formatPesoDisplay } from "../../../packages/utils/src/formatCurrencyInput.ts";
import { financeParityFixtures } from "../../../packages/utils/src/landlordFinanceFixtures.ts";

/**
 * Web side of the landlord finance parity contract
 * (docs/plans/landlord-web-budget-analytics-parity.md §9.1). Both platform
 * suites assert the same shared fixtures, so web and mobile cannot drift on
 * arithmetic, decoding or form rules. The mobile runner is the Jest suite
 * (packages/utils/src/landlordFinance.test.ts).
 */

test("headline income stays cash-based and review-gated", () => {
  for (const fixture of financeParityFixtures.income) {
    assert.equal(financeIncome(fixture.month), fixture.income);
    assert.equal(financeAfterReserve(fixture.month, fixture.reserve), fixture.afterReserve);
  }
});

test("progress arithmetic matches the parity table", () => {
  for (const fixture of financeParityFixtures.budgetProgress) {
    assert.deepStrictEqual(budgetProgress(fixture.amount, fixture.spent), fixture.expected);
  }
});

test("goal suggestions match the parity table", () => {
  for (const fixture of financeParityFixtures.suggestions) {
    assert.deepStrictEqual(suggestFinanceBudget(fixture.budget), fixture.expected);
  }
});

test("older payloads derive picker months from two cached reports", () => {
  const { earlier, latest, expected } = financeParityFixtures.incomeMonthsFallback;
  assert.deepStrictEqual(financeIncomeMonthsFromReports(earlier, latest), expected);
});

test("grouped plans keep reserves separate", () => {
  assert.deepStrictEqual(
    groupBudgetsByCategory(financeParityFixtures.grouping.budgets),
    financeParityFixtures.grouping.expected,
  );
});

test("property performance ranks identically for every metric", () => {
  const { properties, expected } = financeParityFixtures.performance;
  for (const { metric, order } of expected) {
    assert.deepStrictEqual(
      rankFinanceProperties(properties, metric).map((property) => property.id),
      order,
    );
  }
});

test("aging buckets match the parity table", () => {
  for (const { daysLate, bucket } of financeParityFixtures.aging) {
    assert.equal(rentAgeBucket(daysLate), bucket);
  }
});

test("comparison sentences match the parity table", () => {
  for (const fixture of financeParityFixtures.compareSentences) {
    assert.equal(
      financeComparisonSentence(
        fixture.currentMonth,
        fixture.active,
        fixture.comparison,
        formatPesoDisplay,
      ),
      fixture.expected,
    );
  }
});

test("report decoding matches the parity table", () => {
  for (const fixture of financeParityFixtures.decode) {
    if (fixture.error) {
      assert.throws(() => decodeFinanceReport(fixture.payload), { message: fixture.error });
    } else {
      assert.deepStrictEqual(decodeFinanceReport(fixture.payload), fixture.ok);
    }
  }
});

test("expense pages keep the shared keyset contract", () => {
  for (const fixture of financeParityFixtures.expensePage.cases) {
    assert.deepStrictEqual(financeExpensePage(fixture.fetched), {
      rows: fixture.rows,
      next: fixture.next,
    });
  }
});

test("ledger pages keep the shared keyset contract", () => {
  for (const fixture of financeParityFixtures.ledgerPage.cases) {
    assert.deepStrictEqual(financeLedgerPage(fixture.fetched), {
      rows: fixture.rows,
      next: fixture.next,
    });
  }
});

test("peso parsing matches the parity table", () => {
  for (const { value, allowZero, parsed } of financeParityFixtures.amountParsing) {
    assert.equal(parseFinanceAmount(value, allowZero), parsed);
  }
});

test("expense dates match the parity table", () => {
  for (const fixture of financeParityFixtures.dateValidation) {
    assert.equal(validateExpenseDate(fixture.value, fixture.today), fixture.error);
  }
});

test("route months match the parity table", () => {
  for (const { value, currentMonth, resolved } of financeParityFixtures.monthParam) {
    assert.equal(financeMonthFromParam(value, currentMonth), resolved);
  }
});

test("category options match the parity table", () => {
  for (const { kind, ids } of financeParityFixtures.categoryOptions) {
    assert.deepStrictEqual(
      budgetCategoryOptions(kind).map((item) => item.id),
      ids,
    );
  }
});

test("form defaults match the parity table", () => {
  for (const { category, treatment } of financeParityFixtures.treatmentDefault) {
    assert.equal(financeCategoryTreatmentDefault(category), treatment);
  }
  for (const { month, today, date } of financeParityFixtures.dateDefault) {
    assert.equal(financeExpenseDateDefault(month, today), date);
  }
  for (const { category, months } of financeParityFixtures.monthsDefault) {
    assert.equal(financeBudgetMonthsDefault(category), months);
  }
});

test("optional goals match the parity table", () => {
  for (const fixture of financeParityFixtures.goalEntry) {
    assert.deepStrictEqual(financeGoalFromForm(fixture.target, fixture.months), fixture.expected);
  }
});

test("finance failures read the same on every platform", () => {
  for (const fixture of financeParityFixtures.errorMessages) {
    assert.equal(financeErrorMessage(fixture.error), fixture.expected);
  }
});
