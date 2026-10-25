import * as locations from "../../../../packages/constants/src/address/address.ts";
import { getBarangaysByCity } from "../../../../packages/constants/src/address/barangays.ts";
import { getPostalCode } from "../../../../packages/constants/src/address/postal-codes.ts";
import { PH_ZIP_DATABASE } from "../../../../packages/constants/src/address/ph-zip-constants.ts";
import { compile } from "./hook-runtime.mjs";

const zip = compile("../../packages/constants/src/address/zip-match.ts", {
  "./address": locations, "./postal-codes": { getPostalCode }, "./ph-zip-constants": { PH_ZIP_DATABASE },
});
export const addressConstants = { ...locations, getBarangaysByCity, ...zip };
export const addressRules = compile("lib/registration-address.ts", { "@repo/constants": addressConstants });
export const validAddress = { province: "Metro Manila", city: "Navotas", barangay: getBarangaysByCity("Navotas")[0], streetAddress: "123 Test Street", postalCode: "1485" };
