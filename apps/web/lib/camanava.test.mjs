import assert from "node:assert/strict";
import { test } from "node:test";
import { matchBarangay } from "../../../packages/constants/src/address/barangay-match.ts";
import { addressConstants } from "./test-support/registration-address-runtime.mjs";

const {
  CAMANAVA_CITIES,
  getBarangaysByCity,
  isCamanavaCity,
  isCamanavaZipForCity,
  isMetroManilaProvince,
  toCamanavaCity,
} = addressConstants;

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

test("every CAMANAVA city has a barangay list", () => {
  const expected = { Caloocan: 193, Malabon: 21, Navotas: 18, Valenzuela: 33 };
  for (const [city, count] of Object.entries(expected)) {
    assert.equal(getBarangaysByCity(city).length, count, city);
  }
});

test("matchBarangay maps free text to the listed barangay", () => {
  assert.equal(matchBarangay(getBarangaysByCity("Malabon"), "tinajeros"), "Tinajeros");
  assert.equal(matchBarangay(getBarangaysByCity("Malabon"), "  Catmon "), "Catmon");
  assert.equal(matchBarangay(getBarangaysByCity("Valenzuela"), "Arkong  Bato"), "Arkong Bato");
  assert.equal(matchBarangay(getBarangaysByCity("Caloocan"), "Brgy. 12"), "Barangay 12");
  assert.equal(matchBarangay(getBarangaysByCity("Caloocan"), "barangay 100"), "Barangay 100");
  assert.equal(matchBarangay(getBarangaysByCity("Malabon"), "Arkong Bato"), null);
  assert.equal(matchBarangay(getBarangaysByCity("Malabon"), ""), null);
  assert.equal(matchBarangay(getBarangaysByCity("Quezon City"), "Catmon"), null);
});
