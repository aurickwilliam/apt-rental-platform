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
  hasPets: "yes", isSmoker: "no", needParking: "yes", additionalNotes: "",
};

function submitHook(preferences) {
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
    "@repo/utils": shared,
    "@/service/passportService": { fetchPassportDocumentsWithVerification: async () => [] },
    "@/service/tenantApplicationsService": {
      fetchApplicationSubmitContext: async () => ({
        tenantId: "tenant-1", accountStatus: "verified", landlordId: "landlord-1", hasActiveApplication: false, preferences,
      }),
      insertTenantApplication: async (payload) => { inserted.push(plain(payload)); return { id: "app-1" }; },
    },
  });
  const hook = runtime.render(() => useSubmitApplication());
  return { submit: hook.submit, inserted };
}

test("submitting copies the saved details for what the tenant answered yes to", async () => {
  const { submit, inserted } = submitHook(saved);
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

test("the form's answers win: no pets or parking means no details are shared", async () => {
  const { submit, inserted } = submitHook(saved);
  await submit("apt-1", { ...form, hasPets: "no", needParking: "no", isSmoker: "yes" });
  assert.deepEqual(inserted[0].tenant_preferences.pets, { has: false });
  assert.deepEqual(inserted[0].tenant_preferences.parking, { needed: false });
  assert.equal(inserted[0].tenant_preferences.smoker, true);
});

test("a tenant with no saved preferences submits no snapshot", async () => {
  const { submit, inserted } = submitHook(null);
  await submit("apt-1", form);
  assert.equal(inserted[0].tenant_preferences, null);
  assert.equal(inserted[0].has_pets, true);
});

test("the insert sends the snapshot as a JSON column and reads it back fresh at submit", () => {
  const service = source("service/tenantApplicationsService.ts");
  assert.match(service, /tenant_preferences: payload\.tenant_preferences as unknown as Json/);
  assert.match(service, /\.select\("id, account_status, preferences"\)/, "preferences are read when submitting, not taken from the page");
  assert.match(service, /tenant_preferences, *\n? *gov_id_url|message, tenant_preferences/);
});

test("the apply page pre-fills the questions and the landlord and tenant pages show the snapshot", () => {
  assert.match(source("app/browse/[apartmentId]/apply/lib/load-apply-page.ts"), /savedPreferences: parseTenantPreferences\(profile\.preferences\)/);
  const client = source("app/browse/[apartmentId]/apply/components/ApplyClient.tsx");
  assert.match(client, /applicationAnswersFromPreferences\(savedPreferences\)/);
  assert.match(client, /\.\.\.prefilled,/);
  assert.match(source("app/browse/[apartmentId]/apply/components/steps/ReviewStep.tsx"), /Shared with the landlord/);
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
