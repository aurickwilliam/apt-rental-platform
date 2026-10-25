import assert from "node:assert/strict";
import test from "node:test";
import { jsx, jsxs } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as HeroUI from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { GENDERS } from "../../../packages/constants/src/user/gender.ts";
import { PH_MOBILE_PREFIXES } from "../../../packages/constants/src/user/ph-mobile-prefixes.ts";
import * as birthRules from "./birth-date.ts";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import { addressRules, validAddress } from "./test-support/registration-address-runtime.mjs";

const NOW = new Date("2026-10-25T04:00:00Z");
const rules = { ...birthRules, getManilaDate: () => "2026-10-25", validateBirthDate: value => birthRules.validateBirthDate(value, NOW) };
const errors = birthRules.BIRTH_DATE_ERRORS;
const adult = "2000-01-01", underage = "2016-01-01";
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const virtualJsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const parts = (name, keys) => Object.assign(() => {}, Object.fromEntries(keys.map(key => [key, `${name}.${key}`])));
const ui = {
  TextField: "TextField", Input: "Input", Label: "Label", Button: "Button", Form: "Form", Separator: "Separator", Spinner: "Spinner", FieldError: "FieldError",
  Select: parts("Select", ["Trigger", "Value", "Indicator", "Popover"]), ListBox: parts("ListBox", ["Item", "ItemIndicator"]),
  DatePicker: parts("DatePicker", ["Trigger", "TriggerIndicator", "Popover"]), DateField: parts("DateField", ["Group", "Input", "Suffix", "Segment"]),
  Calendar: parts("Calendar", ["Header", "YearPickerTrigger", "YearPickerTriggerHeading", "YearPickerTriggerIndicator", "NavButton", "Grid", "GridHeader", "GridBody", "HeaderCell", "Cell", "YearPickerGrid", "YearPickerGridBody", "YearPickerCell"]),
};
const { validatePHMobile } = compile("../../packages/constants/src/user/ph-mobile.ts", { "./ph-mobile-prefixes": { PH_MOBILE_PREFIXES } });
const constants = { GENDERS, SUFFIXES: [], validatePHMobile, meetsPasswordPolicy: () => true, getPasswordRequirements: () => [], PASSWORD_POLICY_MESSAGE: "password error" };
const { validateSignUpForm } = compile("app/(auth)/sign-up-form/utils.ts", {
  "@/lib/birth-date": rules, "@/lib/registration-address": addressRules, "@repo/constants": constants,
});

function fieldHarness(initial = "", native = false, environment = {}) {
  const runtime = hookRuntime();
  let value = initial, error = null, changes = 0, subscribe;
  const component = compile("app/(auth)/components/RegistrationBirthDateField.tsx", {
    react: { ...runtime.react, useSyncExternalStore: (listener, snapshot) => { subscribe = listener; return snapshot(); } },
    "react/jsx-runtime": native ? { jsx, jsxs } : virtualJsx, "@heroui/react": native ? HeroUI : ui,
    "@internationalized/date": { parseDate }, "@/lib/birth-date": rules,
  }, environment).default;
  const render = () => runtime.render(() => component({ name: "birthDate", value, error, onChange: next => { value = next; error = null; changes++; } }));
  return { render, changes: () => changes, value: () => value,
    change(next) { value = next; error = null; },
    select(next) { render().props.onChange(next ? parseDate(next) : null); },
    focus(value) { render().props.onFocusChange(value); },
    server(message) { error = message; }, subscribe: () => subscribe,
  };
}

test("both input and calendar receive the inclusive dynamic range, retaining efficient year navigation", () => {
  const h = fieldHarness();
  const root = h.render();
  assert.equal(String(root.props.minValue), "1916-10-25"); assert.equal(String(root.props.maxValue), "2008-10-25");
  assert.equal(String(root.props.placeholderValue), "2008-10-25");
  const calendar = nodes(root).find(node => node.type === ui.Calendar);
  assert.equal(String(calendar.props.minValue), "1916-10-25"); assert.equal(String(calendar.props.maxValue), "2008-10-25");
  assert.ok(nodes(calendar).some(node => node.type === "Calendar.YearPickerTrigger"));
  assert.ok(nodes(calendar).some(node => node.type === "Calendar.YearPickerGrid"));
  for (const date of ["1916-10-25", "2008-10-25"]) assert.equal(rules.validateBirthDate(date), null);
  for (const date of ["1916-10-24", "2008-10-26"]) assert.ok(rules.validateBirthDate(date));
});

test("completed invalid selections immediately mark the field invalid and correction clears its inline error", () => {
  const h = fieldHarness();
  h.select("1901-12-13");
  assert.equal(h.render().props.isInvalid, true);
  assert.equal(nodes(h.render()).find(node => node.type === "FieldError").props.children, errors.invalid);
  h.select(underage);
  assert.equal(nodes(h.render()).find(node => node.type === "FieldError").props.children, errors.underage);
  h.select(adult);
  assert.equal(h.render().props.isInvalid, false);
  assert.equal(nodes(h.render()).find(node => node.type === "FieldError").props.children, null);
});

test("empty/partially typed dates stay quiet while editing, then validate on blur or explicit submission", () => {
  const h = fieldHarness();
  assert.equal(h.render().props.isInvalid, false);
  h.focus(true); h.select(null);
  assert.equal(h.render().props.isInvalid, false);
  h.focus(false);
  assert.equal(nodes(h.render()).find(node => node.type === "FieldError").props.children, errors.required);
  h.focus(true); h.select(null);
  assert.equal(h.render().props.isInvalid, false, "editing a partial date must not flash a required error");
  h.server(errors.required);
  assert.equal(h.render().props.isInvalid, true, "a failed submit explicitly reveals the error even while focused");
});

test("old, future and malformed saved values remain visible and are never silently corrected", () => {
  for (const value of ["1901-12-13", "2027-01-01", "2001-02-29"]) {
    const h = fieldHarness(value);
    const root = h.render();
    assert.equal(root.props.isInvalid, true); assert.equal(h.value(), value); assert.equal(h.changes(), 0);
    if (value === "2001-02-29") assert.ok(nodes(root).some(node => node.type === "span" && node.props.children.includes(value)));
    else assert.equal(String(root.props.value), value);
  }
});

test("installed HeroUI marks date segments invalid, associates the error, and announces it without a banner", () => {
  const h = fieldHarness("1901-12-13", true);
  const html = renderToStaticMarkup(h.render());
  assert.match(html, /data-invalid="true"[^>]*data-slot="date-input-group"|data-slot="date-input-group"[^>]*data-invalid="true"/);
  const error = html.match(/<[^>]*data-slot="field-error"[^>]*>/)?.[0];
  const errorId = error?.match(/\bid="([^"]+)"/)?.[1];
  assert.ok(errorId); assert.match(html, /aria-live="polite"/);
  const segment = html.match(/<[^>]*role="spinbutton"[^>]*>/)?.[0];
  assert.match(segment, /aria-invalid="true"/);
  assert.ok(segment.match(/aria-describedby="([^"]+)"/)?.[1].split(" ").includes(errorId));
  assert.equal(html.split(errors.invalid).length - 1, 1);
  assert.doesNotMatch(html, /bg-danger-50/);
});

test("installed calendar disables days outside the boundary while keeping the boundary day selectable", () => {
  for (const [date, validLabel, invalidLabel] of [["1916-10-25", "October 25, 1916", "October 24, 1916"], ["2008-10-25", "October 25, 2008", "October 26, 2008"]]) {
    const h = fieldHarness(date, true);
    const calendar = nodes(h.render()).find(node => node.type === HeroUI.Calendar);
    const html = renderToStaticMarkup(calendar);
    // Calendar cells have actual React Aria labels, not mocked disabled flags.
    const cells = [...html.matchAll(/<[^>]*role="button"[^>]*>/g)].map(match => match[0]);
    assert.ok(cells.some(cell => cell.includes(invalidLabel) && /aria-disabled="true"/.test(cell)));
    assert.ok(cells.some(cell => cell.includes(validLabel) && !/aria-disabled="true"/.test(cell)));
  }
});

test("calendar limits refresh at Manila midnight and on resume, with timer/listener cleanup", () => {
  const timers = [], cleared = [], windowEvents = new Map(), documentEvents = new Map();
  const h = fieldHarness("", false, {
    Date: class extends Date { static now() { return NOW.getTime(); } },
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
    clearTimeout: id => cleared.push(id),
    window: { addEventListener: (name, callback) => windowEvents.set(name, callback), removeEventListener: name => windowEvents.delete(name) },
    document: { addEventListener: (name, callback) => documentEvents.set(name, callback), removeEventListener: name => documentEvents.delete(name) },
  });
  h.render();
  let notifications = 0;
  const cleanup = h.subscribe()(() => notifications++);
  assert.equal(timers[0].delay, 12 * 60 * 60 * 1000);
  timers[0].callback(); assert.equal(notifications, 1);
  windowEvents.get("focus")(); documentEvents.get("visibilitychange")();
  assert.equal(notifications, 3);
  cleanup(); assert.equal(windowEvents.size + documentEvents.size, 0); assert.ok(cleared.length > 0);
});

function formHarness(kind, role, options = {}) {
  const runtime = hookRuntime();
  const sent = [], openedErrors = [], focused = [];
  let serverState = {}, otpOptions;
  const complete = kind === "complete";
  const fieldComponent = "RegistrationBirthDateField";
  const dependencies = {
    react: { ...runtime.react, useActionState: () => [serverState, () => {}, false] },
    "react/jsx-runtime": virtualJsx,
    "@heroui/react": { ...ui, useOverlayState: () => { const [isOpen, set] = runtime.react.useState(false); return { isOpen, open: () => set(true), close: () => set(false) }; } },
    "@repo/constants": constants, "@/lib/birth-date": rules, "@/lib/registration-address": addressRules,
    "../../components/RegistrationAddressFields": { default: "RegistrationAddressFields" },
    "../../components/RegistrationBirthDateField": { default: fieldComponent },
    "../../actions/complete-profile": { completeProfile() {} },
    "next/link": { default: "Link" }, "../../components/AuthContext": { useAuth: () => ({ role, email: "test@example.com" }) },
    "@/app/components/inputs/PasswordField": { default: "PasswordField" }, "@/app/components/inputs/PasswordRequirementList": { default: "PasswordRequirementList" },
    "./OtpModal": { default: "OtpModal" }, "./SuccessModal": { default: "SuccessModal" }, "./ErrorModal": { default: "ErrorModal" },
    "../hooks/useOtpFlow": { useOtpFlow: opts => { otpOptions = opts; return { startCooldown() {} }; } }, "../utils": { validateSignUpForm },
    "../../actions/send-otp": { sendEmailOtp: async (...args) => { sent.push(args); return options.sendResult ?? { success: true }; } },
  };
  const component = compile(complete ? "app/(auth)/complete-profile/components/CompleteProfileForm.tsx" : "app/(auth)/sign-up-form/components/SignUpForm.tsx", dependencies, { requestAnimationFrame: callback => callback() }).default;
  const render = () => runtime.render(() => component({ email: "test@example.com", firstName: "Test", lastName: "User", role, initialAddress: validAddress, initialBirthDate: options.initialBirthDate ?? "" }));
  const field = () => nodes(render()).find(node => node.type === fieldComponent);
  const set = (name, value) => nodes(render()).find(node => node.props?.name === name).props.onChange(value);
  const focusRef = field().props.inputRef;
  focusRef.current = { querySelector: () => ({ focus: () => focused.push(true) }) };
  if (!complete) {
    for (const [name, value] of Object.entries({ firstName: "Test", lastName: "User", gender: GENDERS[0], mobileNumber: "09171234567", password: "ValidPassword1!", confirmPassword: "ValidPassword1!" })) set(name, value);
    nodes(render()).find(node => node.type === "RegistrationAddressFields").props.onChange(validAddress);
  }
  return { render, field, sent, focused, openedErrors,
    change(value) { field().props.onChange(value); },
    server(value) { serverState = value; },
    async submit() {
      let blocked = false;
      const root = nodes(render()).find(node => node.type === (complete ? "form" : "Form"));
      await root.props.onSubmit({ preventDefault() { blocked = true; }, currentTarget: {} });
      return blocked;
    },
    otpError(message, date, verified) { otpOptions.onBirthDateError(message, date, verified); },
  };
}

for (const role of ["tenant", "landlord"]) for (const kind of ["regular", "complete"]) {
  test(`${role} ${kind}: invalid submissions focus Birth Date, preserve state and never open a generic error modal`, async () => {
    const h = formHarness(kind, role);
    for (const date of ["", underage, "1901-12-13", "2001-02-29", "2027-01-01"]) {
      h.change(date);
      await h.submit();
      assert.equal(h.field().props.error, rules.validateBirthDate(date));
      assert.ok(h.focused.length > 0);
      assert.equal(h.field().props.value, date);
      assert.equal(h.sent.length, 0);
      assert.equal(nodes(h.render()).some(node => node.type === "ErrorModal" && node.props.isOpen), false);
      assert.equal(nodes(h.render()).some(node => node.props?.className?.includes("bg-danger-50")), false);
    }
    h.change(adult);
    assert.equal(h.field().props.error, null);
    const blocked = await h.submit();
    if (kind === "regular") { assert.equal(h.sent.length, 1); assert.equal(h.sent[0][4], adult); }
    else assert.equal(blocked, false);
  });
}

test("Complete Profile preserves prefilled invalid dates and retires server errors after a correction", async () => {
  const h = formHarness("complete", "tenant", { initialBirthDate: "1901-12-13" });
  assert.equal(h.field().props.value, "1901-12-13");
  await h.submit(); assert.equal(h.field().props.error, errors.invalid);
  h.change(adult); h.server({ birthDateError: errors.invalid, birthDate: "1901-12-13" });
  assert.equal(h.field().props.error, null);
});

test("typed server rejection before signup stays inline, and a post-verification rejection preserves sign-in-to-finish guidance", async () => {
  const h = formHarness("regular", "tenant", { sendResult: { birthDateError: errors.invalid, birthDate: adult } });
  h.change(adult); await h.submit();
  assert.equal(h.field().props.error, errors.invalid);
  assert.equal(nodes(h.render()).some(node => node.type === "ErrorModal" && node.props.isOpen), false);
  h.otpError(errors.invalid, adult, true);
  assert.ok(nodes(h.render()).some(node => node.type === "Link" && node.props.href === "/sign-in"));
  h.change("1999-01-01"); assert.equal(h.field().props.error, null);
});

function submission(date, role = "tenant", complete = true) {
  const values = complete ? {
    first_name: "Test", last_name: "User", gender: GENDERS[0], mobile_number: "09171234567", birth_date: date,
    street_address: validAddress.streetAddress, barangay: validAddress.barangay, city: validAddress.city, province: validAddress.province, postal_code: "1485", role,
  } : {
    userId: "caller", email: "input@example.com", firstName: "Test", lastName: "User", middleName: "", gender: GENDERS[0], mobileNumber: "09171234567", birthDate: date,
    streetAddress: validAddress.streetAddress, barangay: validAddress.barangay, city: validAddress.city, stateProvince: validAddress.province, postalCode: "1485", password: "ValidPassword1!", confirmPassword: "ValidPassword1!", role,
  };
  const fd = new FormData(); for (const [key, value] of Object.entries(values)) if (value != null) fd.set(key, value);
  return fd;
}

function actionHarness(kind, options = {}) {
  const writes = [], auth = [];
  const client = {
    auth: { getUser: async () => { auth.push("getUser"); return { data: { user: options.signedOut ? null : { id: "caller", email: "caller@example.com" } }, error: null }; },
      signUp: async args => { auth.push(args); return { error: options.authError ?? null }; } },
    from: () => {
      const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { roles: ["tenant"], mobile_number: null, account_status: "unverified" }, error: null }),
        update: value => { writes.push(value); return q; }, insert: value => { writes.push(value); return q; }, then: resolve => resolve({ error: options.dbError ?? null }) };
      return q;
    }, rpc: async () => ({ error: null }),
  };
  const actions = compile(`app/(auth)/actions/${kind}.ts`, {
    "next/navigation": { redirect: path => { throw new Error(`redirect:${path}`); } }, "next/headers": { cookies: async () => ({ set() {} }) },
    "@repo/supabase/server": { createClient: async () => client }, "@/lib/portal-preference": { PORTAL_COOKIE: "apt_portal" },
    "@repo/constants": constants, "@/lib/birth-date": rules, "@/lib/registration-address": addressRules,
    "../sign-up-form/utils": { validateSignUpForm }, "@repo/utils": { getEmailCodeRequestError: message => message },
  }, { process: { env: { NODE_ENV: "test" } } });
  return { actions, writes, auth };
}

test("all three server entry points reject the same invalid dates, without creating accounts or writing profiles", async () => {
  for (const value of ["", null, underage, "1901-12-13", "2001-02-29", "2027-01-01"]) {
    const complete = actionHarness("complete-profile"), signup = actionHarness("sign-up"), otp = actionHarness("send-otp");
    for (const result of [
      await complete.actions.completeProfile({}, submission(value)),
      await signup.actions.signUp({ error: null, success: false }, submission(value, "tenant", false)),
      await otp.actions.sendEmailOtp("test@example.com", "password", "First", "Last", value),
    ]) {
      assert.equal(result.birthDateError, rules.validateBirthDate(value)); assert.ok(!result.error);
    }
    assert.equal(complete.writes.length + signup.writes.length, 0);
    assert.equal(otp.auth.length, 0, "invalid birth dates must not invoke Auth signup");
  }
});

test("valid server submissions retain role destinations, Auth signup options and caller-owned profile writes", async () => {
  for (const role of ["tenant", "landlord"]) {
    const complete = actionHarness("complete-profile"), signup = actionHarness("sign-up"), otp = actionHarness("send-otp");
    await assert.rejects(complete.actions.completeProfile({}, submission(adult, role)), role === "tenant" ? /redirect:\/tenant\/personalize/ : /redirect:\/landlord\/dashboard/);
    assert.equal(complete.writes[0].birth_date, adult);
    assert.equal((await signup.actions.signUp({ error: null, success: false }, submission(adult, role, false))).success, true);
    assert.equal(signup.writes[0].email, "caller@example.com"); assert.equal(signup.writes[0].user_id, "caller");
    assert.equal(signup.writes[0].roles[0], role); assert.equal(signup.writes[0].birth_date, adult);
    assert.equal((await otp.actions.sendEmailOtp("test@example.com", "password", "First", "Last", adult)).success, true);
    assert.equal(otp.auth[0].options.data.full_name, "First Last");
  }
});

test("known database birth-date guard errors map inline, while permission/network failures remain general", async () => {
  for (const dbError of [{ code: "P0001", message: "Please enter a valid date of birth." }, { code: "42501", message: "Permission denied" }]) {
    const signup = actionHarness("sign-up", { dbError }), complete = actionHarness("complete-profile", { dbError });
    const results = [await signup.actions.signUp({ error: null, success: false }, submission(adult, "tenant", false)), await complete.actions.completeProfile({}, submission(adult))];
    for (const result of results) {
      if (dbError.code === "P0001") { assert.equal(result.birthDateError, errors.invalid); assert.ok(!result.error); }
      else { assert.ok(result.error); assert.equal(result.birthDateError, undefined); }
    }
  }
});

test("valid dates do not bypass session or role isolation", async () => {
  const signedOut = actionHarness("sign-up", { signedOut: true });
  assert.ok((await signedOut.actions.signUp({ error: null, success: false }, submission(adult, "tenant", false))).error);
  assert.equal(signedOut.writes.length, 0);
  const admin = actionHarness("sign-up");
  assert.ok((await admin.actions.signUp({ error: null, success: false }, submission(adult, "admin", false))).error);
  assert.equal(admin.writes.length, 0);
  const wrong = submission(adult, "tenant", false); wrong.set("userId", "other-account");
  const owner = actionHarness("sign-up");
  assert.ok((await owner.actions.signUp({ error: null, success: false }, wrong)).error); assert.equal(owner.writes.length, 0);
});

test("OTP verification routes typed birth-date failures inline while preserving profile-less session cleanup", async () => {
  for (const kind of ["birth", "general", "success"]) {
    const runtime = hookRuntime();
    const fieldErrors = [], generic = [], signedOut = [], closed = [], successes = [];
    const otpFlow = compile("app/(auth)/sign-up-form/hooks/useOtpFlow.ts", {
      react: runtime.react,
      "../../hooks/use-resend-cooldown": { useResendCooldown: () => ({ cooldown: 0, start() {}, stop() {}, format() {} }) },
      "../../hooks/use-otp-attempts": { useOtpAttempts: () => ({ locked: false, recordWrongCode() {}, reset() {} }) },
      "@repo/supabase/browser": { createClient: () => ({ auth: { verifyOtp: async () => ({ data: { user: { id: "caller" } } }), signOut: async () => signedOut.push(true) } }) },
      "@repo/utils": { getOtpAttemptError: () => "wrong code" },
      "../../actions/sign-up": { signUp: async () => kind === "birth" ? { birthDateError: errors.invalid, birthDate: adult, error: null, success: false } : kind === "general" ? { error: "Network failure", success: false } : { error: null, success: true } },
      "../../actions/send-otp": { sendEmailOtp: async () => ({ success: true }) },
    }, { FormData });
    const hook = runtime.render(() => otpFlow.useOtpFlow({ formData: { ...validAddress, birthDate: adult, email: "test@example.com", postalCode: 1485 }, role: "tenant", showError: message => generic.push(message), onSuccessOpen: () => successes.push(true), onBirthDateError: (...args) => fieldErrors.push(args) }));
    runtime.flush(); await hook.handleVerifyOtp(() => closed.push(true));
    assert.equal(closed.length, 1);
    if (kind === "birth") { assert.equal(fieldErrors[0][0], errors.invalid); assert.equal(fieldErrors[0][2], true); assert.equal(generic.length, 0); assert.equal(signedOut.length, 1); }
    if (kind === "general") { assert.equal(generic.length, 1); assert.equal(fieldErrors.length, 0); assert.equal(signedOut.length, 1); }
    if (kind === "success") { assert.equal(successes.length, 1); assert.equal(signedOut.length, 0); }
  }
});
