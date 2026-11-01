import assert from "node:assert/strict";
import test from "node:test";
import { PH_ADDRESSES } from "../../../packages/constants/src/address/ph-addresses.ts";
import { addressConstants, addressRules } from "./test-support/registration-address-runtime.mjs";

const { PROVINCES, CITIES, getCitiesByProvince, getBarangaysByCity, isZipPlausibleForCity } = addressConstants;
const { validateRegistrationAddress: validate, resolveRegistrationAddress: resolve } = addressRules;
const plain = (value) => JSON.parse(JSON.stringify(value));

// PSGC lists 1,634 cities and municipalities (the National Capital Region's districts included).
const PSGC_CITIES_AND_MUNICIPALITIES = 1634;

test("every province, city and municipality of the country can be picked, each with barangays", () => {
  assert.equal(PROVINCES.length, 83, "82 provinces plus Metro Manila");
  assert.equal(PROVINCES[0], "Metro Manila");
  let cityCount = 0;
  for (const province of PROVINCES) {
    const cities = getCitiesByProvince(province);
    assert.ok(cities.length > 0, `${province} has no city`);
    for (const city of cities) {
      cityCount += 1;
      assert.ok(getBarangaysByCity(city, province).length > 0, `${province} / ${city} has no barangay`);
    }
  }
  assert.ok(cityCount >= PSGC_CITIES_AND_MUNICIPALITIES, `only ${cityCount} cities and municipalities`);
});

test("the municipalities the old short list left out are selectable", () => {
  for (const [province, city] of [
    ["Metro Manila", "Pateros"],
    ["Bulacan", "Baliwag"],
    ["Bulacan", "Marilao"],
    ["Pangasinan", "Lingayen"],
    ["Cebu", "Consolacion"],
    ["Cotabato", "Pikit"],
    ["Quezon", "Lucena"],
    ["Maguindanao del Norte", "Cotabato City"],
  ]) {
    assert.ok(getCitiesByProvince(province).includes(city), `${province} / ${city}`);
    assert.equal(validate({ province, city, barangay: getBarangaysByCity(city, province)[0], streetAddress: "1 Main St", postalCode: "1000" }).barangay, undefined);
  }
  // Lucena belongs to Quezon, not Laguna.
  assert.equal(getCitiesByProvince("Laguna").includes("Lucena"), false);
});

test("a city name used by several provinces gets that province's own barangays", () => {
  const pampanga = getBarangaysByCity("San Fernando", "Pampanga");
  const laUnion = getBarangaysByCity("San Fernando", "La Union");
  assert.ok(pampanga.includes("Alasas") && !pampanga.includes("Abut"));
  assert.ok(laUnion.includes("Abut") && !laUnion.includes("Alasas"));
  for (const province of ["Davao del Sur", "Ilocos Sur", "Laguna", "Marinduque", "Occidental Mindoro", "Zambales"]) {
    assert.ok(getBarangaysByCity("Santa Cruz", province).length > 0, province);
  }
  // Without a province an ambiguous name is never guessed.
  assert.deepEqual(getBarangaysByCity("San Fernando"), []);
  assert.deepEqual(getBarangaysByCity("Santa Cruz"), []);
});

test("without a province, Metro Manila and names used by one province still resolve", () => {
  assert.deepEqual(getBarangaysByCity("Navotas"), getBarangaysByCity("Navotas", "Metro Manila"));
  assert.deepEqual(getBarangaysByCity("Baliwag"), getBarangaysByCity("Baliwag", "Bulacan"));
  assert.deepEqual(getBarangaysByCity("Navotas", "Bulacan"), [], "a city in another province");
  for (const [province, city] of [["__proto__", "Navotas"], ["constructor", "Navotas"], ["Metro Manila", "__proto__"], ["Metro Manila", "constructor"]]) {
    assert.deepEqual(getBarangaysByCity(city, province), [], `${province} / ${city}`);
  }
  assert.deepEqual(getBarangaysByCity("__proto__"), []);
});

test("the sign-up rules accept the barangay of the chosen province's city and reject another province's", () => {
  const base = { province: "Pampanga", city: "San Fernando", streetAddress: "1 Main St", postalCode: "2000" };
  assert.deepEqual(plain(validate({ ...base, barangay: "Alasas" })), {});
  assert.ok(validate({ ...base, barangay: "Abut" }).barangay, "a La Union barangay");
  assert.deepEqual(plain(resolve({ ...base, barangay: "alasas" })).barangay, "Alasas");
  assert.equal(resolve({ ...base, barangay: "Abut" }).barangay, "");
});

test("ZIP rules cover Pateros and stay open for a municipality with no published ZIP", () => {
  assert.equal(isZipPlausibleForCity("Pateros", "Metro Manila", "1620"), true);
  assert.equal(isZipPlausibleForCity("Pateros", "Metro Manila", "1630"), false);
  assert.equal(isZipPlausibleForCity("Baliwag", "Bulacan", "3006"), true);
  assert.equal(isZipPlausibleForCity("Baliwag", "Bulacan", "300"), false);
});

test("the generated table is clean: unique names, no blanks, no broken encoding", () => {
  for (const [province, cities] of Object.entries(PH_ADDRESSES)) {
    assert.deepEqual(Object.keys(cities), [...getCitiesByProvince(province)]);
    for (const [city, barangays] of Object.entries(cities)) {
      assert.equal(city, city.trim(), `${province} / ${city}`);
      assert.doesNotMatch(city, /[ÃÂ�]/, `${province} / ${city}`);
      assert.equal(new Set(barangays).size, barangays.length, `${province} / ${city} repeats a barangay`);
      for (const barangay of barangays) {
        assert.ok(barangay && barangay === barangay.trim() && !/\s\s/.test(barangay), `${province} / ${city} / "${barangay}"`);
        assert.doesNotMatch(barangay, /[ÃÂ�]/, `${province} / ${city} / ${barangay}`);
      }
    }
  }
  assert.deepEqual(Object.keys(CITIES), [...PROVINCES]);
});
