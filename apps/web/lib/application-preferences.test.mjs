import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));
const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const shared = compile("../../packages/utils/src/applicationPreferences.ts", {});

const saved = {
  selectedCities: [],
  budgetMin: 5000,
  budgetMax: 100000,
  bedroomCount: null,
  householdSize: null,
  hasPets: true,
  kindOfPets: ["Dog"],
  noOfPets: 1,
  nameOfPets: "Max",
  hasParking: true,
  noOfParkingSpots: 2,
  listOfVehicles: ["Car", "Motorcycle"],
  hasSmoker: false,
  hasDisability: true,
};

const form = {
  occupation: "Engineer", companyName: "Acme", monthlyIncome: 30000, employmentType: "Employed",
  prevLandlordName: "", prevLandlordContact: "", moveInDate: "2026-12-01", noOccupants: "2",
  hasPets: "yes", kindOfPets: ["Dog"], noOfPets: 1, nameOfPets: "Max",
  isSmoker: "no",
  needParking: "yes", noOfParkingSpots: 2, listOfVehicles: ["Car", "Motorcycle"],
  hasDisability: "yes", additionalNotes: "",
};
const formPreferences = compile("lib/application-form-preferences.ts", {
  "@repo/utils": shared,
  "./tenant-preferences": compile("lib/tenant-preferences.ts", {}),
});

function submitHook() {
  const runtime = hookRuntime();
  const inserted = [];
  const { useSubmitApplication } = compile("hooks/use-submit-application.ts", {
    react: runtime.react,
    "@repo/passport": {
      evaluateApplicationReadiness: () => ({
        isReady: true,
        issues: [],
        selection: {
          docs: {
            govId: { storage_path: "id", verification_id: null, storage_path_back: null },
            proofOfBilling: { storage_path: "billing" },
            proofOfIncome: { storage_path: "income" },
            nbiClearance: null,
          },
        },
      }),
    },
    "@/lib/application-form-preferences": formPreferences,
    "@repo/constants": compile("../../packages/constants/src/user/ph-mobile.ts", {}),
    "@/service/passportService": { fetchPassportDocumentsWithVerification: async () => [] },
    "@/service/tenantApplicationsService": {
      fetchApplicationSubmitContext: async () => ({
        tenantId: "tenant-1", accountStatus: "verified", landlordId: "landlord-1", hasActiveApplication: false,
      }),
      insertTenantApplication: async (payload) => { inserted.push(plain(payload)); return { id: "app-1" }; },
    },
  });
  const hook = runtime.render(() => useSubmitApplication());
  return { submit: hook.submit, inserted };
}

test("submitting stores the details the tenant declared on the form", async () => {
  const { submit, inserted } = submitHook();
  const result = await submit("apt-1", form);
  assert.equal(result.success, true);
  assert.deepEqual(inserted[0].tenant_preferences, {
    version: 1,
    pets: { has: true, kinds: ["Dog"], count: 1, names: "Max" },
    parking: { needed: true, spots: 2, vehicles: ["Car", "Motorcycle"] },
    smoker: false,
    householdDisability: true,
  });
  assert.equal(inserted[0].has_pets, true, "the form's own answers are still written");
});

test("the previous landlord's number is stored without the spaces the field shows", async () => {
  const { submit, inserted } = submitHook();
  await submit("apt-1", { ...form, prevLandlordName: "Ana", prevLandlordContact: "0917 123 4567" });
  assert.equal(inserted[0].prev_landlord_contact, "09171234567");
});

test("answering no shares no pet or parking details, even if some were typed earlier", async () => {
  const { submit, inserted } = submitHook();
  await submit("apt-1", { ...form, hasPets: "no", needParking: "no", isSmoker: "yes", hasDisability: "no" });
  assert.deepEqual(inserted[0].tenant_preferences.pets, { has: false });
  assert.deepEqual(inserted[0].tenant_preferences.parking, { needed: false });
  assert.equal(inserted[0].tenant_preferences.smoker, true);
  assert.equal(inserted[0].tenant_preferences.householdDisability, false);
});

test("the saved preferences only pre-fill the form, and details come along only for a yes", () => {
  assert.deepEqual(plain(formPreferences.applicationFormDefaultsFromPreferences(saved)), {
    hasPets: "yes", kindOfPets: ["Dog"], noOfPets: 1, nameOfPets: "Max",
    needParking: "yes", noOfParkingSpots: 2, listOfVehicles: ["Car", "Motorcycle"],
    isSmoker: "no", hasDisability: "yes",
  });
  const none = formPreferences.applicationFormDefaultsFromPreferences({ ...saved, hasPets: false, hasParking: false });
  assert.deepEqual(plain(none.kindOfPets), []);
  assert.equal(none.nameOfPets, null);
  assert.deepEqual(plain(none.listOfVehicles), []);
  assert.equal(formPreferences.applicationFormDefaultsFromPreferences(null), null, "nothing saved: questions start unanswered");
});

test("the insert sends the snapshot as a JSON column and reads it back fresh at submit", () => {
  const service = source("service/tenantApplicationsService.ts");
  assert.match(service, /tenant_preferences: payload\.tenant_preferences as unknown as Json/);
  assert.match(service, /tenant_preferences, *\n? *gov_id_url|message, tenant_preferences/);
});

test("the apply page pre-fills the questions and the landlord and tenant pages show the snapshot", () => {
  assert.match(source("app/browse/[apartmentId]/apply/lib/load-apply-page.ts"), /savedPreferences: parseTenantPreferences\(profile\.preferences\)/);
  const client = source("app/browse/[apartmentId]/apply/components/ApplyClient.tsx");
  assert.match(client, /applicationFormDefaultsFromPreferences\(savedPreferences\)/);
  assert.match(client, /\.\.\.prefilled,/);
  assert.match(source("app/browse/[apartmentId]/apply/components/steps/ReviewStep.tsx"), /The landlord sees these details with your application/);
  assert.match(source("app/landlord/applications/[applicationId]/page.tsx"), /describeApplicationPreferences\(app\.preferences\)/);
  assert.match(source("app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx"), /describeApplicationPreferences\(application\.preferences\)/);
});

test("the migration adds only a column and a check: no trigger touches the audited application guards", () => {
  const migration = readFileSync(new URL("../../../supabase/migrations/20261104000000_application_preference_snapshot.sql", import.meta.url), "utf8");
  assert.match(migration, /add column if not exists tenant_preferences jsonb/);
  assert.match(migration, /rental_application_tenant_preferences_shape/);
  assert.doesNotMatch(migration, /create (or replace )?(trigger|function)/i);
  assert.doesNotMatch(migration, /guard_rental_application/);
});
