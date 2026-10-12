import assert from "node:assert/strict";
import { test } from "node:test";
import { applicantPersonalInfo } from "./application-profile.ts";

const profile = {
  first_name: "Juan",
  middle_name: "Santos",
  last_name: "Dela Cruz",
  email: "juan@example.com",
  mobile_number: "09171234567",
  birth_date: "2001-07-21",
  street_address: "24A Manolo Compound",
  barangay: "Dalandanan",
  city: "Valenzuela",
  province: "Metro Manila",
};

test("fills the personal details from the profile", () => {
  assert.deepEqual(applicantPersonalInfo(profile), {
    fullName: "Juan Santos Dela Cruz",
    email: "juan@example.com",
    dateOfBirth: "2001-07-21",
    contactNumber: "09171234567",
    currentAddress: "24A Manolo Compound, Dalandanan, Valenzuela, Metro Manila",
  });
});

test("skips missing name and address parts", () => {
  const info = applicantPersonalInfo({ ...profile, middle_name: null, street_address: " ", province: null });
  assert.equal(info.fullName, "Juan Dela Cruz");
  assert.equal(info.currentAddress, "Dalandanan, Valenzuela");
});

test("falls back to the sign-in email and leaves unknown fields empty", () => {
  const info = applicantPersonalInfo(
    { ...profile, email: null, mobile_number: null, birth_date: null },
    "juan@auth.example",
  );
  assert.equal(info.email, "juan@auth.example");
  assert.equal(info.contactNumber, "");
  assert.equal(info.dateOfBirth, "");
});
