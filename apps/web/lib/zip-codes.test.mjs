import assert from "node:assert/strict";
import test from "node:test";
import { PH_CITY_ZIPS } from "../../../packages/constants/src/address/ph-city-zips.ts";
import { addressConstants } from "./test-support/registration-address-runtime.mjs";

const { CITIES, METRO_MANILA_ZIP_RANGES, getPostalCode, isZipPlausibleForCity } = addressConstants;

test("every Metro Manila city accepts its whole PHLPost ZIP block and nothing outside it", () => {
  for (const city of CITIES["Metro Manila"]) {
    const range = METRO_MANILA_ZIP_RANGES[city];
    assert.ok(range, `${city} has no ZIP block`);
    for (let zip = range.min; zip <= range.max; zip += 1) {
      assert.equal(isZipPlausibleForCity(city, "Metro Manila", String(zip)), true, `${city} ${zip}`);
    }
    assert.equal(isZipPlausibleForCity(city, "Metro Manila", String(range.min - 1)), false, `${city} below block`);
    assert.equal(isZipPlausibleForCity(city, "Metro Manila", String(range.max + 1)), false, `${city} above block`);
  }
});

test("valid ZIPs that the old partial list rejected are accepted", () => {
  assert.equal(isZipPlausibleForCity("Quezon City", "Metro Manila", "1102"), true);
  assert.equal(isZipPlausibleForCity("Pasay", "Metro Manila", "1305"), true);
  assert.equal(isZipPlausibleForCity("Taguig", "Metro Manila", "1635"), true);
  assert.equal(isZipPlausibleForCity("Parañaque", "Metro Manila", "1709"), true);
  assert.equal(isZipPlausibleForCity("Antipolo", "Rizal", "1870"), true);
  assert.equal(isZipPlausibleForCity("Santiago", "Isabela", "3311"), true);
  assert.equal(isZipPlausibleForCity("Cauayan", "Isabela", "3305"), true);
  assert.equal(isZipPlausibleForCity("Vigan", "Ilocos Sur", "2700"), true);
  assert.equal(isZipPlausibleForCity("Lipa", "Batangas", "4217"), true);
  assert.equal(isZipPlausibleForCity("Davao City", "Davao del Sur", "8016"), true);
});

test("a ZIP that belongs to another city is rejected", () => {
  assert.equal(isZipPlausibleForCity("Quezon City", "Metro Manila", "1200"), false);
  assert.equal(isZipPlausibleForCity("Vigan", "Ilocos Sur", "2200"), false);
  assert.equal(isZipPlausibleForCity("Antipolo", "Rizal", "1920"), false);
  assert.equal(isZipPlausibleForCity("San Fernando", "La Union", "2000"), false);
  assert.equal(isZipPlausibleForCity("San Fernando", "Pampanga", "2500"), false);
  assert.equal(isZipPlausibleForCity("Dagupan", "Pangasinan", "24000"), false);
});

test("a city with no published ZIP only gets the format check", () => {
  assert.equal(PH_CITY_ZIPS["Sulu"]?.["Tongkil"], undefined);
  assert.equal(isZipPlausibleForCity("Tongkil", "Sulu", "7400"), true);
  assert.equal(isZipPlausibleForCity("Tongkil", "Sulu", "740"), false);
});

test("the ZIP table only holds 4-digit codes for cities the app offers", () => {
  for (const [province, cities] of Object.entries(PH_CITY_ZIPS)) {
    for (const [city, zips] of Object.entries(cities)) {
      assert.ok(CITIES[province]?.includes(city), `${province} / ${city} is not in CITIES`);
      assert.ok(zips.length > 0, `${province} / ${city} is empty`);
      for (const zip of zips) assert.match(zip, /^\d{4}$/, `${province} / ${city}`);
    }
  }
});

test("prefilled ZIPs are the city's first code and pass validation", () => {
  assert.equal(getPostalCode("Quezon City", "Metro Manila"), "1100");
  assert.equal(getPostalCode("Antipolo", "Rizal"), "1870");
  assert.equal(getPostalCode("Vigan", "Ilocos Sur"), "2700");
  assert.equal(getPostalCode("Malolos", "Bulacan"), "3000");
  assert.equal(getPostalCode("San Fernando", "Pampanga"), "2000");
  assert.equal(getPostalCode("San Fernando", "La Union"), "2500");
  assert.equal(getPostalCode("Navotas"), "1485");
  assert.equal(getPostalCode("San Fernando"), null);
  assert.equal(getPostalCode("Tongkil", "Sulu"), null);
  for (const [province, cities] of Object.entries(CITIES)) {
    for (const city of cities) {
      const zip = getPostalCode(city, province);
      if (zip) assert.equal(isZipPlausibleForCity(city, province, zip), true, `${province} / ${city} ${zip}`);
    }
  }
});
