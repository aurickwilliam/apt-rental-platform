import * as generated from "../../../../packages/constants/src/address/ph-addresses.ts";
import { PH_CITY_ZIPS } from "../../../../packages/constants/src/address/ph-city-zips.ts";
import { compile } from "./hook-runtime.mjs";

// address.ts imports the generated table without a file extension, which Node cannot resolve.
const locations = compile("../../packages/constants/src/address/address.ts", { "./ph-addresses": generated });
const zip = compile("../../packages/constants/src/address/zip-match.ts", {
  "./address": locations, "./ph-city-zips": { PH_CITY_ZIPS },
});
// Arrays built inside the compiled module belong to another realm; hand tests plain ones so deepEqual works.
const hostArrays = (fn) => (...args) => [...fn(...args)];
export const addressConstants = {
  ...locations, ...zip,
  PROVINCES: [...locations.PROVINCES],
  CAMANAVA_CITIES: [...locations.CAMANAVA_CITIES],
  CITIES: Object.fromEntries(Object.entries(locations.CITIES).map(([province, cities]) => [province, [...cities]])),
  getCitiesByProvince: hostArrays(locations.getCitiesByProvince),
  getBarangaysByCity: hostArrays(locations.getBarangaysByCity),
};
export const addressRules = compile("lib/registration-address.ts", { "@repo/constants": addressConstants });
export const validAddress = { province: "Metro Manila", city: "Navotas", barangay: addressConstants.getBarangaysByCity("Navotas")[0], streetAddress: "123 Test Street", postalCode: "1485" };
