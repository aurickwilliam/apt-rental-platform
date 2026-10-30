import assert from "node:assert/strict";
import test from "node:test";
import { jsx, jsxs } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as HeroUI from "@heroui/react";
import { GENDERS } from "../../../packages/constants/src/user/gender.ts";
import { validateBirthDate } from "./birth-date.ts";
import { addressConstants, addressRules, validAddress } from "./test-support/registration-address-runtime.mjs";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";

const { EMPTY_REGISTRATION_ADDRESS: empty, changeRegistrationAddress: change, resolveRegistrationAddress: resolve, validateRegistrationAddress: validate } = addressRules;
const plain = value => JSON.parse(JSON.stringify(value));
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const jsxRuntime = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const ui = {
  FieldError: "FieldError", Input: "Input", Label: "Label", TextField: "TextField", Button: "Button", Form: "Form", Separator: "Separator", Spinner: "Spinner",
  Select: Object.assign(() => {}, { Trigger: "Trigger", Value: "Value", Indicator: "Indicator", Popover: "Popover" }),
  ListBox: Object.assign(() => {}, { Item: "Item", ItemIndicator: "ItemIndicator" }),
  DatePicker: Object.assign(() => {}, { Popover: "DatePopover", Trigger: "DateTrigger", TriggerIndicator: "DateTriggerIndicator" }),
  DateField: { Group: "Group", Input: "DateInput", Suffix: "Suffix" },
  Calendar: Object.assign(() => {}, Object.fromEntries(["Header", "YearPickerTrigger", "YearPickerTriggerHeading", "YearPickerTriggerIndicator", "NavButton", "Grid", "GridHeader", "GridBody", "YearPickerGrid", "YearPickerGridBody"].map(key => [key, key]))),
  ComboBox: Object.assign(() => {}, { InputGroup: "ComboBoxInputGroup", Trigger: "ComboBoxTrigger", Popover: "ComboBoxPopover" }),
  InputGroup: Object.assign(() => {}, { Input: "InputGroupInput", Suffix: "InputGroupSuffix" }),
  Tooltip: Object.assign(() => {}, { Trigger: "TooltipTrigger", Content: "TooltipContent" }),
  useOverlayState: () => ({ isOpen: false, open() {}, close() {} }),
};
const constants = { ...addressConstants, GENDERS, SUFFIXES: [], getPasswordRequirements: () => [] };
const icons = { IconInfoCircle: "IconInfoCircle" };
const fields = compile("app/(auth)/components/RegistrationAddressFields.tsx", {
  "react/jsx-runtime": jsxRuntime, "@heroui/react": ui, "@tabler/icons-react": icons, "@repo/constants": constants, "@/lib/registration-address": addressRules,
}).default;

function fieldHarness(initial = empty) {
  let value = { ...initial };
  const render = (errors = {}) => fields({ value, onChange: next => { value = next; }, errors });
  const field = name => nodes(render()).find(node => node.props?.name === name);
  return { render, field, value: () => value,
    change(name, text) { const { onSelectionChange, onChange } = field(name).props; (onSelectionChange ?? onChange)(text); },
    options(name) { return nodes(field(name)).filter(node => node.type === "Item").map(node => node.props.id); },
  };
}

test("shared selectors use exactly the regular signup data and enforce province → city → barangay dependencies", () => {
  const h = fieldHarness();
  assert.deepEqual(h.options("stateProvince"), [...addressConstants.PROVINCES]);
  assert.equal(h.field("city").props.isDisabled, true);
  const placeholder = name => nodes(h.field(name)).find(node => node.type === "Input").props.placeholder;
  assert.equal(placeholder("city"), "Select a province first");
  assert.equal(placeholder("stateProvince"), "Search or select your state/province");
  assert.equal(h.field("barangay").props.isDisabled, true);
  h.change("stateProvince", "Metro Manila");
  assert.equal(h.field("city").props.isDisabled, false);
  assert.deepEqual(h.options("city"), addressConstants.getCitiesByProvince("Metro Manila"));
  h.change("city", "Navotas");
  assert.equal(h.field("barangay").props.isDisabled, false);
  assert.equal(placeholder("barangay"), "Search or select your barangay");
  assert.deepEqual(h.options("barangay"), addressConstants.getBarangaysByCity("Navotas"));
  h.change("barangay", validAddress.barangay);
  h.change("stateProvince", "Cebu");
  assert.equal(h.value().city, ""); assert.equal(h.value().barangay, "");
  assert.equal(h.field("barangay").props.isDisabled, true);
  assert.ok(h.options("city").includes("Cebu City"));
});

test("province, city and barangay are searchable combo boxes that stay controlled by the selected key", () => {
  const h = fieldHarness(validAddress);
  for (const [name, key] of [["stateProvince", validAddress.province], ["city", validAddress.city], ["barangay", validAddress.barangay]]) {
    const props = h.field(name).props;
    assert.equal(props.selectedKey, key, name);
    assert.equal(props.menuTrigger, "focus", name);
    assert.equal(nodes(h.field(name)).some(node => node.type === "ComboBoxTrigger"), true, name);
  }
  const empty = fieldHarness();
  assert.equal(empty.field("city").props.selectedKey, null);
  empty.field("stateProvince").props.onSelectionChange(null);
  assert.equal(empty.value().province, "");
});

test("changing the province empties everything after it, but re-picking the same one or a first pick keeps typed text", () => {
  const h = fieldHarness(validAddress);
  h.change("stateProvince", "Metro Manila");
  assert.deepEqual(plain(h.value()), validAddress);
  h.change("stateProvince", "Cebu");
  assert.deepEqual(plain(h.value()), { ...empty, province: "Cebu" });
  assert.ok(h.options("city").includes("Cebu City"));

  const cleared = fieldHarness(validAddress);
  cleared.change("stateProvince", "");
  assert.deepEqual(plain(cleared.value()), plain(empty));

  const firstPick = fieldHarness({ ...empty, streetAddress: "Typed first", postalCode: "1485" });
  firstPick.change("stateProvince", "Metro Manila");
  assert.deepEqual(plain(firstPick.value()), { ...empty, province: "Metro Manila", streetAddress: "Typed first", postalCode: "1485" });
});

test("changing the city empties barangay, street and postal code, but keeps the province", () => {
  const h = fieldHarness(validAddress);
  h.change("city", "Navotas");
  assert.deepEqual(plain(h.value()), validAddress);
  h.change("city", "Valenzuela");
  assert.deepEqual(plain(h.value()), { ...empty, province: "Metro Manila", city: "Valenzuela" });
  assert.deepEqual(h.options("barangay"), addressConstants.getBarangaysByCity("Valenzuela"));

  const cleared = fieldHarness(validAddress);
  cleared.change("city", "");
  assert.deepEqual(plain(cleared.value()), { ...empty, province: "Metro Manila" });
});

test("changing the barangay empties street and postal code, but keeps province and city", () => {
  const h = fieldHarness(validAddress);
  h.change("barangay", validAddress.barangay);
  assert.deepEqual(plain(h.value()), validAddress);
  const other = addressConstants.getBarangaysByCity("Navotas").find(name => name !== validAddress.barangay);
  h.change("barangay", other);
  assert.deepEqual(plain(h.value()), { ...plain(empty), province: validAddress.province, city: validAddress.city, barangay: other });

  const cleared = fieldHarness(validAddress);
  cleared.change("barangay", "");
  assert.deepEqual(plain(cleared.value()), { ...plain(empty), province: validAddress.province, city: validAddress.city });

  const firstPick = fieldHarness({ ...validAddress, barangay: "", streetAddress: "Typed first", postalCode: "1485" });
  firstPick.change("barangay", validAddress.barangay);
  assert.deepEqual(plain(firstPick.value()), { ...validAddress, streetAddress: "Typed first" });
});

test("saved selector labels and safely equivalent legacy labels prefill, but unknown IDs/labels never guess locations", () => {
  assert.deepEqual(plain(resolve(validAddress)), validAddress);
  assert.deepEqual(plain(resolve({ ...validAddress, province: " metro manila ", city: "NAVOTAS", barangay: validAddress.barangay.toLowerCase() })), validAddress);
  for (const province of ["unknown", "130000000", "constructor", "__proto__"]) {
    const value = resolve({ ...validAddress, province });
    assert.equal(value.province, ""); assert.equal(value.city, ""); assert.equal(value.barangay, "");
    assert.equal(value.streetAddress, validAddress.streetAddress); assert.equal(value.postalCode, "1485");
  }
  const city = resolve({ ...validAddress, city: "not in dataset" });
  assert.equal(city.province, "Metro Manila"); assert.equal(city.city, ""); assert.equal(city.barangay, "");
  const barangay = resolve({ ...validAddress, barangay: "legacy ID" });
  assert.equal(barangay.city, "Navotas"); assert.equal(barangay.barangay, "");
});

test("required and tampered address values are rejected independently of the selectors", () => {
  assert.deepEqual(plain(validate(validAddress)), {});
  assert.deepEqual(Object.keys(validate(empty)).sort(), ["barangay", "city", "postalCode", "province", "streetAddress"].sort());
  for (const value of [
    { ...validAddress, province: "__proto__" },
    { ...validAddress, province: "constructor" },
    { ...validAddress, province: "Cebu" },
    { ...validAddress, city: "constructor" },
    { ...validAddress, barangay: "pasted fake barangay" },
    { ...validAddress, postalCode: "14a5" },
    { ...validAddress, postalCode: "0001" },
    { ...validAddress, streetAddress: "   " },
  ]) assert.ok(Object.keys(validate(value)).length > 0);
  const forged = change(validAddress, "city", "Cebu City");
  assert.equal(forged.city, ""); assert.equal(forged.barangay, "");
});

test("a well-formed ZIP we do not recognize for the city is a warning, not an error", () => {
  const unfamiliar = { ...validAddress, postalCode: "9999" };
  assert.equal(validate(unfamiliar).postalCode, undefined);
  assert.equal(addressRules.getRegistrationZipWarning(unfamiliar), `This ZIP isn't one we recognize for ${validAddress.city}. Double-check it.`);
  assert.equal(addressRules.getRegistrationZipWarning(validAddress), null);
  assert.equal(addressRules.getRegistrationZipWarning({ ...validAddress, postalCode: "14a5" }), null);
});

test("an unrecognized ZIP shows an info icon whose tooltip carries the note, not text under the field", () => {
  const warning = `This ZIP isn't one we recognize for ${validAddress.city}. Double-check it.`;
  const h = fieldHarness({ ...validAddress, postalCode: "9999" });
  const parts = nodes(h.field("postalCode"));
  assert.equal(parts.find(node => node.type === "TooltipContent")?.props.children, warning);
  assert.ok(parts.some(node => node.type === "InputGroupSuffix"));
  assert.equal(parts.some(node => node.type === "p"), false);
  const recognized = nodes(fieldHarness(validAddress).field("postalCode"));
  assert.equal(recognized.some(node => node.type === "TooltipContent" || node.type === "InputGroupSuffix"), false);
  const html = renderToStaticMarkup(compile("app/(auth)/components/RegistrationAddressFields.tsx", {
    "react/jsx-runtime": { jsx, jsxs }, "@heroui/react": HeroUI, "@tabler/icons-react": icons, "@repo/constants": constants, "@/lib/registration-address": addressRules,
  }).default({ value: { ...validAddress, postalCode: "9999" }, onChange() {} }));
  assert.match(html, /aria-label="About this postal code"/);
});

test("street and ZIP remain editable, user-entered valid ZIPs are not auto-replaced, and geographic coverage stays nationwide", () => {
  const h = fieldHarness(validAddress);
  h.change("streetAddress", "  Unit 2, Existing Street  ");
  assert.equal(h.value().streetAddress, "  Unit 2, Existing Street  ");
  h.change("postalCode", "14a89 extra");
  assert.equal(h.value().postalCode, "1489");
  assert.equal(validate(h.value()).postalCode, undefined);
  assert.ok(addressConstants.PROVINCES.includes("Cebu"));
  assert.ok(addressConstants.PROVINCES.includes("Davao del Sur"));
});

test("shared fields preserve ordered two-column desktop / stacked mobile layout and inline errors", () => {
  const h = fieldHarness();
  const root = h.render(validate(empty));
  assert.match(root.props.className, /grid-cols-1.*md:grid-cols-2/);
  const controls = nodes(root).filter(node => node.props?.name);
  assert.deepEqual(controls.map(node => node.props.name), ["stateProvince", "city", "barangay", "streetAddress", "postalCode"]);
  for (const field of controls) {
    assert.equal(field.props.isRequired, true); assert.equal(field.props.isInvalid, true);
    assert.equal(field.props.validationBehavior, "aria");
    assert.ok(nodes(field).some(node => node.type === "FieldError" && node.props.children));
  }
  assert.equal(nodes(root).filter(node => node.props?.className?.includes("bg-danger-50")).length, 0);
});

test("installed HeroUI provides input error association and disabled dependent selectors", () => {
  const nativeFields = compile("app/(auth)/components/RegistrationAddressFields.tsx", {
    "react/jsx-runtime": { jsx, jsxs }, "@heroui/react": HeroUI, "@tabler/icons-react": icons, "@repo/constants": constants, "@/lib/registration-address": addressRules,
  }).default;
  const html = renderToStaticMarkup(nativeFields({ value: empty, onChange() {}, errors: validate(empty) }));
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="[^"]+"/);
  assert.match(html, /Select a province first/); assert.match(html, /Select a city first/);
  assert.match(html, /aria-disabled="true"|disabled=""/);
  assert.equal((html.match(/data-slot="field-error"/g) ?? []).length, 5);
});

function formHarness(kind, role, initialAddress = undefined) {
  const runtime = hookRuntime();
  const shared = {
    react: { ...runtime.react, useActionState: () => [{}, () => {}, false] },
    "react/jsx-runtime": jsxRuntime, "@heroui/react": ui, "@repo/constants": constants,
    "@/lib/registration-address": addressRules, "@/lib/birth-date": { validateBirthDate },
    "../../components/RegistrationAddressFields": { default: "RegistrationAddressFields" },
    "../../components/RegistrationBirthDateField": { default: "RegistrationBirthDateField" },
    "next/link": { default: "Link" },
  };
  const complete = kind === "complete";
  const component = compile(complete ? "app/(auth)/complete-profile/components/CompleteProfileForm.tsx" : "app/(auth)/sign-up-form/components/SignUpForm.tsx", complete ? {
    ...shared, "../../actions/complete-profile": { completeProfile() {} },
  } : {
    ...shared, "../../components/AuthContext": { useAuth: () => ({ role, email: "test@example.com" }) },
    "@/app/components/inputs/PasswordField": { default: "PasswordField" },
    "@/app/components/inputs/PasswordRequirementList": { default: "PasswordRequirementList" },
    "./OtpModal": { default: "OtpModal" }, "./SuccessModal": { default: "SuccessModal" }, "./ErrorModal": { default: "ErrorModal" },
    "../hooks/useOtpFlow": { useOtpFlow: () => ({}) }, "../utils": { validateSignUpForm: () => null },
    "../../actions/send-otp": { sendEmailOtp: async () => ({}) },
  }, { FormData: class { get() { return "2000-01-01"; } } }).default;
  const render = () => runtime.render(() => component({ email: "test@example.com", firstName: "Test", lastName: "User", role, initialAddress }));
  const addressNode = () => nodes(render()).find(node => node.type === "RegistrationAddressFields");
  return { render, addressNode, fields: () => fields(addressNode().props),
    change(name, value) { const { onSelectionChange, onChange } = nodes(fields(addressNode().props)).find(node => node.props?.name === name).props; (onSelectionChange ?? onChange)(value); },
    submit() { const form = nodes(render()).find(node => node.type === (complete ? "form" : "Form")); return form.props.onSubmit({ preventDefault() {}, currentTarget: {} }); },
  };
}

for (const role of ["tenant", "landlord"]) {
  test(`${role}: regular and Complete Profile compose identical selectors and inline required validation`, async () => {
    const regular = formHarness("regular", role), complete = formHarness("complete", role);
    regular.change("stateProvince", "Metro Manila"); complete.change("province", "Metro Manila");
    regular.change("city", "Navotas"); complete.change("city", "Navotas");
    for (const h of [regular, complete]) {
      const control = nodes(h.fields()).find(node => node.props?.name === "barangay");
      assert.deepEqual(nodes(control).filter(node => node.type === "Item").map(node => node.props.id), addressConstants.getBarangaysByCity("Navotas"));
      await h.submit();
      assert.ok(h.addressNode().props.errors.barangay);
      assert.ok(h.addressNode().props.errors.streetAddress);
      assert.ok(h.addressNode().props.errors.postalCode);
    }
  });
}

test("Complete Profile seeds valid saved values once and marks unsafe legacy locations for correction", () => {
  const saved = formHarness("complete", "tenant", validAddress);
  assert.deepEqual(plain(saved.addressNode().props.value), validAddress);
  saved.change("province", "Cebu");
  assert.equal(saved.addressNode().props.value.province, "Cebu", "rerenders do not overwrite the draft from saved props");
  const unknown = formHarness("complete", "landlord", { ...validAddress, city: "unknown" });
  assert.equal(unknown.addressNode().props.value.city, "");
  assert.ok(unknown.addressNode().props.errors.city);
  assert.equal(unknown.addressNode().props.value.streetAddress, validAddress.streetAddress);
});

const { validatePHMobile } = compile("../../packages/constants/src/user/ph-mobile.ts");
const serverConstants = { ...constants, validatePHMobile };
const year = new Date().getFullYear() - 25;
function submission(address = validAddress, role = "tenant") {
  const data = new FormData();
  for (const [key, value] of Object.entries({ first_name: "Test", last_name: "User", birth_date: `${year}-01-01`, gender: GENDERS[0], mobile_number: "09171234567", role,
    province: address.province, city: address.city, barangay: address.barangay, street_address: address.streetAddress, postal_code: address.postalCode, user_id: "attacker" })) data.set(key, value);
  return data;
}
function actionHarness(options = {}) {
  const writes = [], rpcs = [], selects = [];
  const profile = "profile" in options ? options.profile : { roles: ["tenant"], mobile_number: null, account_status: "unverified" };
  const client = {
    auth: { getUser: async () => ({ data: { user: options.signedOut ? null : { id: "caller", email: "caller@example.com" } }, error: null }) },
    from: () => {
      const q = { select: () => q, eq: (...args) => { selects.push(args); return q; }, maybeSingle: async () => ({ data: profile, error: null }),
        update: value => { writes.push(value); return q; }, insert: value => { writes.push(value); return q; }, then: resolve => resolve({ error: null }) };
      return q;
    },
    rpc: async (name, args) => { rpcs.push([name, args]); return { data: { suspended: options.suspended ?? false }, error: null }; },
  };
  const { completeProfile } = compile("app/(auth)/actions/complete-profile.ts", {
    "next/navigation": { redirect: path => { throw new Error(`redirect:${path}`); } }, "next/headers": { cookies: async () => ({ set() {} }) },
    "@repo/supabase/server": { createClient: async () => client }, "@/lib/portal-preference": { PORTAL_COOKIE: "apt_portal" },
    "@repo/constants": serverConstants, "@/lib/birth-date": { validateBirthDate }, "@/lib/registration-address": addressRules,
  }, { process: { env: { NODE_ENV: "test" } } });
  return { completeProfile, writes, selects, rpcs };
}

test("Complete Profile rejects forged dependent values and missing address fields server-side before writes or role RPCs", async () => {
  for (const address of [empty, { ...validAddress, province: "Cebu" }, { ...validAddress, barangay: "pasted bogus value" }, { ...validAddress, postalCode: "" }]) {
    const h = actionHarness();
    const result = await h.completeProfile({}, submission(address));
    assert.ok(Object.keys(result.addressErrors).length);
    assert.equal(result.error, undefined);
    assert.deepEqual(plain(result.address), plain(address));
    assert.equal(h.writes.length, 0); assert.equal(h.rpcs.length, 0);
  }
});

test("valid Tenant/Landlord payloads retain existing column names, caller ownership and role/onboarding paths", async () => {
  for (const role of ["tenant", "landlord"]) for (const profile of [null, { roles: [role], mobile_number: null, account_status: "unverified" }]) {
    const h = actionHarness({ profile });
    await assert.rejects(h.completeProfile({}, submission(validAddress, role)), /redirect:\/(tenant\/personalize\?fresh=1|landlord\/dashboard)/);
    assert.equal(h.writes.length, 1);
    const row = h.writes[0];
    assert.equal(row.province, validAddress.province); assert.equal(row.city, validAddress.city); assert.equal(row.barangay, validAddress.barangay);
    assert.equal(row.street_address, validAddress.streetAddress); assert.equal(row.postal_code, 1485);
    assert.equal(row.stateProvince, undefined); assert.equal(row.streetAddress, undefined);
    if (!profile) { assert.equal(row.user_id, "caller"); assert.equal(row.email, "caller@example.com"); assert.deepEqual(plain(row.roles), [role]); }
    else { assert.ok(h.selects.some(([column, value]) => column === "user_id" && value === "caller")); assert.equal(h.rpcs[0][0], "set_onboarding_role"); }
  }
});

test("existing account restrictions still prevent signed-out, suspended and completed/admin profiles from writing", async () => {
  for (const options of [{ signedOut: true }, { profile: null, suspended: true }, { profile: { roles: ["admin"], account_status: "unverified" } }, { profile: { roles: ["tenant"], mobile_number: "phone", account_status: "verified" } }]) {
    const h = actionHarness(options);
    try { const result = await h.completeProfile({}, submission()); assert.ok(result.error); }
    catch (error) { assert.match(error.message, /redirect:\/suspended/); }
    assert.equal(h.writes.length, 0);
  }
});

test("regular signup's server-used validator rejects address tampering through the same shared rules", () => {
  const { validateForm } = compile("app/(auth)/sign-up-form/utils.ts", {
    "@/lib/birth-date": { validateBirthDate }, "@/lib/registration-address": addressRules,
    "@repo/constants": { ...serverConstants, meetsPasswordPolicy: () => true, PASSWORD_POLICY_MESSAGE: "password error" },
  });
  const form = { firstName: "Test", lastName: "User", password: "ValidPassword1!", confirmPassword: "ValidPassword1!", birthDate: `${year}-01-01`, gender: GENDERS[0], mobileNumber: "09171234567",
    stateProvince: validAddress.province, city: validAddress.city, barangay: validAddress.barangay, streetAddress: validAddress.streetAddress, postalCode: 1485 };
  assert.equal(validateForm(form), null);
  assert.match(validateForm({ ...form, stateProvince: "Cebu" }), /Select a city/);
  assert.match(validateForm({ ...form, barangay: "fake" }), /Select a barangay/);
});

test("Complete Profile loads only the caller's saved address and keys the draft by Auth account", async () => {
  for (const account of ["caller-a", "caller-b"]) {
    const filters = [], columns = [];
    const row = { roles: ["tenant"], mobile_number: null, account_status: "unverified", email: "account@example.com",
      province: validAddress.province, city: validAddress.city, barangay: validAddress.barangay,
      street_address: validAddress.streetAddress, postal_code: 1485 };
    const q = { select: value => { columns.push(value); return q; }, eq: (...args) => { filters.push(args); return q; }, maybeSingle: async () => ({ data: row }) };
    const page = compile("app/(auth)/complete-profile/page.tsx", {
      "react/jsx-runtime": { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) },
      "next/navigation": { redirect: () => assert.fail("incomplete account must retain onboarding") }, "next/image": { default: "Image" },
      "@repo/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: account } } }) }, from: () => q }) },
      "@/lib/portal-preference": { preferredPortal: () => "tenant" }, "./components/CompleteProfileForm": { default: "CompleteProfileForm" },
    }).default;
    const form = nodes(await page({ searchParams: Promise.resolve({ role: "tenant" }) })).find(node => node.type === "CompleteProfileForm");
    assert.deepEqual(plain(form.props.initialAddress), validAddress);
    assert.equal(form.key, account);
    assert.deepEqual(filters, [["user_id", account]]);
    assert.equal(columns.length, 1, "prefill extends the existing profile read rather than adding another read");
  }
});
