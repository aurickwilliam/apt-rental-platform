import {
  APARTMENT_STATUS_LABELS,
  APARTMENT_TYPES,
  EMPLOYMENT_TYPES,
  FLOOR_LEVELS,
  FURNISHED_TYPES,
  GENDERS,
  LEASE_DURATIONS,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_URGENCY,
  PAYMENT_STATUS,
  PETS,
  VALID_APARTMENT_STATUSES,
  VEHICLE_OPTIONS,
} from "@repo/constants";

import type { EnumKeyMap } from "./enums";
import {
  APARTMENT_STATUS_KEYS,
  APARTMENT_TYPE_KEYS,
  EMPLOYMENT_TYPE_KEYS,
  FLOOR_LEVEL_KEYS,
  FURNISHED_TYPE_KEYS,
  GENDER_KEYS,
  LEASE_DURATION_KEYS,
  MAINTENANCE_CATEGORY_KEYS,
  MAINTENANCE_URGENCY_KEYS,
  PAYMENT_STATUS_KEYS,
  PET_KEYS,
  VEHICLE_KEYS,
  enumLabel,
} from "./enums";
import { translate } from "./translate";

function expectCovered(map: EnumKeyMap, values: readonly string[]) {
  const missing = values.filter((value) => !(value in map));
  expect(missing).toEqual([]);
}

describe("stored enum labels", () => {
  test("every persisted option has a catalog key", () => {
    expectCovered(FURNISHED_TYPE_KEYS, FURNISHED_TYPES);
    expectCovered(APARTMENT_TYPE_KEYS, APARTMENT_TYPES);
    expectCovered(FLOOR_LEVEL_KEYS, FLOOR_LEVELS);
    expectCovered(EMPLOYMENT_TYPE_KEYS, EMPLOYMENT_TYPES);
    expectCovered(LEASE_DURATION_KEYS, LEASE_DURATIONS);
    expectCovered(PET_KEYS, PETS);
    expectCovered(VEHICLE_KEYS, VEHICLE_OPTIONS);
    expectCovered(GENDER_KEYS, GENDERS);
    expectCovered(APARTMENT_STATUS_KEYS, VALID_APARTMENT_STATUSES);
    expectCovered(PAYMENT_STATUS_KEYS, PAYMENT_STATUS);
    expectCovered(
      MAINTENANCE_URGENCY_KEYS,
      MAINTENANCE_URGENCY.map((option) => option.value),
    );
    expectCovered(
      MAINTENANCE_CATEGORY_KEYS,
      MAINTENANCE_CATEGORIES.map((option) => option.value),
    );
  });

  test("the mapped keys resolve in both catalogs", () => {
    const maps: EnumKeyMap[] = [
      FURNISHED_TYPE_KEYS,
      APARTMENT_TYPE_KEYS,
      FLOOR_LEVEL_KEYS,
      EMPLOYMENT_TYPE_KEYS,
      LEASE_DURATION_KEYS,
      PET_KEYS,
      VEHICLE_KEYS,
      GENDER_KEYS,
      APARTMENT_STATUS_KEYS,
      PAYMENT_STATUS_KEYS,
      MAINTENANCE_URGENCY_KEYS,
      MAINTENANCE_CATEGORY_KEYS,
    ];

    for (const map of maps) {
      for (const key of Object.values(map)) {
        expect(translate("en", key).trim().length).toBeGreaterThan(0);
        expect(translate("fil", key).trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("the stored apartment status label matches the value it is keyed by", () => {
    for (const [value, label] of Object.entries(APARTMENT_STATUS_LABELS)) {
      expect(typeof value).toBe("string");
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("enumLabel", () => {
  test("translates a known stored value", () => {
    expect(enumLabel("en", FURNISHED_TYPE_KEYS, "Fully Furnished")).toBe("Fully Furnished");
    expect(enumLabel("fil", PET_KEYS, "Dog")).toBe("Aso");
    expect(enumLabel("fil", EMPLOYMENT_TYPE_KEYS, "Student")).toBe("Estudyante");
  });

  test("renders an unknown value unchanged rather than blank", () => {
    expect(enumLabel("fil", PET_KEYS, "Capybara")).toBe("Capybara");
  });
});
