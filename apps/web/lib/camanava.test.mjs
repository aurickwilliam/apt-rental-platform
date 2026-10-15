import assert from "node:assert/strict";
import { test } from "node:test";
import { CAMANAVA_CITIES, isCamanavaCity } from "../../../packages/constants/src/address/address.ts";

test("only the four CAMANAVA cities are valid listing cities", () => {
  assert.deepEqual(CAMANAVA_CITIES, ["Caloocan", "Malabon", "Navotas", "Valenzuela"]);

  for (const city of CAMANAVA_CITIES) {
    assert.equal(isCamanavaCity(city), true);
  }

  for (const city of ["Quezon City", "Manila", "Caloocan City", "caloocan", ""]) {
    assert.equal(isCamanavaCity(city), false);
  }
});
