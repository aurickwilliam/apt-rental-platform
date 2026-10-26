import * as locations from "../../../../packages/constants/src/address/address.ts";
import { getBarangaysByCity } from "../../../../packages/constants/src/address/barangays.ts";
import { PH_CITY_ZIPS } from "../../../../packages/constants/src/address/ph-city-zips.ts";
import { compile } from "./hook-runtime.mjs";

const zip = compile("../../packages/constants/src/address/zip-match.ts", {
  "./address": locations, "./ph-city-zips": { PH_CITY_ZIPS },
});
export const addressConstants = { ...locations, getBarangaysByCity, ...zip };
export const addressRules = compile("lib/registration-address.ts", { "@repo/constants": addressConstants });
export const validAddress = { province: "Metro Manila", city: "Navotas", barangay: getBarangaysByCity("Navotas")[0], streetAddress: "123 Test Street", postalCode: "1485" };
