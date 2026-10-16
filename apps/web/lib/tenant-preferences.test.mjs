import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BEDROOM_OPTIONS,
  BUDGET_PRESETS,
  DEFAULT_TENANT_PREFERENCES,
  HOUSEHOLD_OPTIONS,
  PREFERENCE_BUDGET_MAX,
  PREFERENCE_BUDGET_MIN,
  matchBudgetPreset,
  orderBudgetRange,
  parseBudgetDraftAmount,
  parseTenantPreferences,
  validateTenantPreferences,
} from "./tenant-preferences.ts";

test("parses a stored mobile payload into the shared shape", () => {
  const parsed = parseTenantPreferences({
    selectedCities: ["Navotas", "Malabon"],
    budgetMin: 8000,
    budgetMax: 25000,
    bedroomCount: "1-2 Bedrooms",
    householdSize: "Family of 2",
    hasPets: true,
    kindOfPets: "Dog",
    nameOfPets: null,
    hasParking: true,
    noOfParkingSpots: 2,
    listOfVehicles: ["Motorcycle"],
    hasSmoker: false,
    hasDisability: false,
  });
  assert.equal(parsed?.bedroomCount, "1-2 Bedrooms");
  assert.equal(parsed?.noOfParkingSpots, 2);
  assert.equal(validateTenantPreferences(parsed), null);
});

test("rejects absent or malformed payloads", () => {
  assert.equal(parseTenantPreferences(null), null);
  assert.equal(parseTenantPreferences(undefined), null);
  assert.equal(parseTenantPreferences("prefs"), null);
  assert.equal(parseTenantPreferences({ budgetMin: 1 }), null);
});

test("fills safe defaults for missing fields", () => {
  const parsed = parseTenantPreferences({ selectedCities: [] });
  assert.deepEqual(parsed, DEFAULT_TENANT_PREFERENCES);
});

test("defaults match the mobile onboarding contract", () => {
  assert.deepEqual(DEFAULT_TENANT_PREFERENCES.bedroomCount, null);
  assert.deepEqual(DEFAULT_TENANT_PREFERENCES.householdSize, null);
  assert.equal(DEFAULT_TENANT_PREFERENCES.budgetMin, PREFERENCE_BUDGET_MIN);
  assert.equal(DEFAULT_TENANT_PREFERENCES.budgetMax, PREFERENCE_BUDGET_MAX);
  assert.ok(BEDROOM_OPTIONS.includes("1-2 Bedrooms"));
  assert.ok(HOUSEHOLD_OPTIONS.includes("Single"));
});

test("rejects out-of-range budgets and bad option values", () => {
  const base = { ...DEFAULT_TENANT_PREFERENCES };
  assert.match(
    validateTenantPreferences({ ...base, budgetMin: 20000, budgetMax: 10000 }) ?? "",
    /budget range/,
  );
  assert.match(
    validateTenantPreferences({ ...base, budgetMin: 1000, budgetMax: 20000 }) ?? "",
    /budget range/,
  );
  assert.match(
    validateTenantPreferences({ ...base, bedroomCount: "10 Bedrooms" }) ?? "",
    /bedroom option/,
  );
  assert.match(
    validateTenantPreferences({ ...base, noOfParkingSpots: 9 }) ?? "",
    /parking spots/,
  );
});

test("requires a pet kind when the household has pets", () => {
  const base = { ...DEFAULT_TENANT_PREFERENCES, hasPets: true, kindOfPets: "" };
  assert.match(validateTenantPreferences(base) ?? "", /kind of pet/);
  assert.equal(
    validateTenantPreferences({ ...base, kindOfPets: "Cat" }),
    null,
  );
});

test("maps each preset to its exact numeric range", () => {
  assert.deepEqual(
    BUDGET_PRESETS.map((preset) => [preset.min, preset.max]),
    [
      [5000, 14999],
      [15000, 29999],
      [30000, 59999],
      [60000, 100000],
    ],
  );
});

test("budget labels explicitly describe their unchanged numeric ranges", () => {
  assert.deepEqual(
    BUDGET_PRESETS.map((preset) => preset.label),
    ["₱5,000 – ₱14,999", "₱15,000 – ₱29,999", "₱30,000 – ₱59,999", "₱60,000 – ₱100,000"],
  );
  for (const preset of BUDGET_PRESETS) {
    assert.equal(matchBudgetPreset(preset.min, preset.max), preset.id);
    assert.equal(
      validateTenantPreferences({ ...DEFAULT_TENANT_PREFERENCES, budgetMin: preset.min, budgetMax: preset.max }),
      null,
    );
  }
});

test("budget presets are contiguous with no gaps", () => {
  for (let i = 0; i < BUDGET_PRESETS.length - 1; i++) {
    assert.equal(BUDGET_PRESETS[i].max + 1, BUDGET_PRESETS[i + 1].min);
  }
  assert.equal(BUDGET_PRESETS[0].min, PREFERENCE_BUDGET_MIN);
  assert.equal(BUDGET_PRESETS[BUDGET_PRESETS.length - 1].max, PREFERENCE_BUDGET_MAX);
});

test("gap prices from the old ranges now fall inside presets", () => {
  const inPreset = (value, preset) => value >= preset.min && value <= preset.max;
  assert.ok(inPreset(14500, BUDGET_PRESETS[0]));
  assert.ok(inPreset(14999, BUDGET_PRESETS[0]));
  assert.ok(inPreset(29500, BUDGET_PRESETS[1]));
  assert.ok(inPreset(59999, BUDGET_PRESETS[2]));
});

test("reverse-matches exact ranges and nothing else", () => {
  assert.equal(matchBudgetPreset(5000, 14999), "under-15k");
  assert.equal(matchBudgetPreset(15000, 29999), "15k-29k");
  assert.equal(matchBudgetPreset(30000, 59999), "30k-59k");
  assert.equal(matchBudgetPreset(60000, 100000), "over-60k");
  assert.equal(matchBudgetPreset(5000, 100000), null);
  assert.equal(matchBudgetPreset(8000, 20000), null);
  assert.equal(matchBudgetPreset(15000, 30000), null);
  assert.equal(matchBudgetPreset(30000, 60000), null);
  // Old gapped ranges are preserved as custom, never rewritten.
  assert.equal(matchBudgetPreset(5000, 14000), null);
  assert.equal(matchBudgetPreset(15000, 29000), null);
});

test("parses custom-range drafts with step snapping and clamping", () => {
  assert.equal(parseBudgetDraftAmount("14,500"), 15000);
  assert.equal(parseBudgetDraftAmount("₱29,500"), 30000);
  assert.equal(parseBudgetDraftAmount("14,499"), 14000);
  assert.equal(parseBudgetDraftAmount("100"), PREFERENCE_BUDGET_MIN);
  assert.equal(parseBudgetDraftAmount("9999999"), PREFERENCE_BUDGET_MAX);
  assert.ok(Number.isNaN(parseBudgetDraftAmount("abc")));
  assert.ok(Number.isNaN(parseBudgetDraftAmount("")));
  assert.deepEqual(orderBudgetRange(30000, 10000), [10000, 30000]);
  assert.deepEqual(orderBudgetRange(10000, 30000), [10000, 30000]);
});
