import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAMANAVA_CITIES,
  isCamanavaCity,
  isCamanavaZipForCity,
  isMetroManilaProvince,
  toCamanavaCity,
} from "../../../packages/constants/src/address/address.ts";

test("only the four CAMANAVA cities are valid listing cities", () => {
  assert.deepEqual(CAMANAVA_CITIES, ["Caloocan", "Malabon", "Navotas", "Valenzuela"]);

  for (const city of CAMANAVA_CITIES) {
    assert.equal(isCamanavaCity(city), true);
  }

  for (const city of ["Quezon City", "Manila", "Caloocan City", "caloocan", ""]) {
    assert.equal(isCamanavaCity(city), false);
  }
});

test("ZIP codes must fall in the selected CAMANAVA city's range", () => {
  assert.equal(isCamanavaZipForCity("Caloocan", "1400"), true);
  assert.equal(isCamanavaZipForCity("Caloocan", "1428"), true);
  assert.equal(isCamanavaZipForCity("Valenzuela", "1444"), true);
  assert.equal(isCamanavaZipForCity("Malabon", "1478"), true);
  assert.equal(isCamanavaZipForCity("Navotas", "1489"), true);

  assert.equal(isCamanavaZipForCity("Caloocan", "1440"), false);
  assert.equal(isCamanavaZipForCity("Navotas", "1470"), false);
  assert.equal(isCamanavaZipForCity("Malabon", "147"), false);
  assert.equal(isCamanavaZipForCity("Malabon", "14700"), false);
  assert.equal(isCamanavaZipForCity("Quezon City", "1100"), false);
});

test("geocoder city and province names map to listing values", () => {
  assert.equal(toCamanavaCity("Caloocan City"), "Caloocan");
  assert.equal(toCamanavaCity("City of Valenzuela"), "Valenzuela");
  assert.equal(toCamanavaCity("Kalookan"), "Caloocan");
  assert.equal(toCamanavaCity("navotas"), "Navotas");
  assert.equal(toCamanavaCity("Quezon City"), null);
  assert.equal(toCamanavaCity(""), null);

  assert.equal(isMetroManilaProvince("Metro Manila"), true);
  assert.equal(isMetroManilaProvince("National Capital Region"), true);
  assert.equal(isMetroManilaProvince("Bulacan"), false);
});
