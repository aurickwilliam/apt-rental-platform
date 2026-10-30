import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as HeroUI from "@heroui/react";
import * as policies from "./registration-policies.ts";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import { addressRules, validAddress } from "./test-support/registration-address-runtime.mjs";
import { terms, privacy } from "./test-support/legal-policy-runtime.mjs";

const accepted = { ...policies.emptyRegistrationAcceptance(), termsAccepted: true, privacyAccepted: true };
const virtualJsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];

test("acceptance is explicit and versioned, never truthy strings, metadata or a default", () => {
  assert.equal(policies.emptyRegistrationAcceptance().termsAccepted, false);
  assert.equal(policies.emptyRegistrationAcceptance().privacyAccepted, false);
  assert.deepEqual(policies.validateRegistrationAcceptance(accepted), {});
  for (const value of [null, {}, { ...accepted, termsAccepted: "true" }, { ...accepted, privacyAccepted: 1 }, { ...accepted, termsVersion: "old" }, { ...accepted, privacyVersion: "old" }]) assert.ok(Object.keys(policies.validateRegistrationAcceptance(value)).length);
  const data = new FormData(); policies.writeRegistrationAcceptance(data, accepted);
  assert.deepEqual(policies.readRegistrationAcceptance(data), accepted);
  data.set("termsAccepted", "on"); assert.equal(policies.readRegistrationAcceptance(data).termsAccepted, false);
  assert.equal(terms.LEGAL_META.version, policies.REGISTRATION_POLICIES.terms.version);
  assert.equal(privacy.LEGAL_META.version, policies.REGISTRATION_POLICIES.privacy.version);
});

test("installed HeroUI renders required checkboxes and non-submitting policy dialog buttons", () => {
  const Component = compile("app/(auth)/components/RegistrationPolicyAcceptance.tsx", {
    react: React, "react/jsx-runtime": jsx, "@heroui/react": HeroUI,
    "./RegistrationPoliciesModal": { default: () => null, preloadRegistrationPolicyContent() {} }, "@/lib/registration-policies": policies,
  }).default;
  const html = renderToStaticMarkup(jsx.jsx(Component, { value: policies.emptyRegistrationAcceptance(), onChange() {}, errors: policies.validateRegistrationAcceptance(policies.emptyRegistrationAcceptance()) }));
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /\schecked="/);
  assert.equal((html.match(/aria-required="true"/g) ?? []).length, 2);
  for (const policy of Object.values(policies.REGISTRATION_POLICIES)) {
    assert.ok(html.includes(policy.label));
  }
  assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 2);
  assert.equal((html.match(/type="button"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /target="_blank"|href="\/(pap|tos)"/);
  assert.equal((html.match(/role="alert"/g) ?? []).length, 2);
  assert.match(html, /text-muted-foreground/);
  assert.match(html, /text-sm font-normal leading-5 text-foreground/);
  assert.match(html, /space-y-1 text-xs leading-5 text-muted-foreground/);
  assert.match(html, /<p>False information.*<\/p><p>Personal data/);
  assert.doesNotMatch(html, /Accept both policies to enable registration/);
  assert.doesNotMatch(html, /securely processed|will be banned/);
});

test("policy reading opens the requested tab and closes without changing explicit acceptance", () => {
  const runtime = hookRuntime();
  const changes = [];
  const preloads = [];
  const Component = compile("app/(auth)/components/RegistrationPolicyAcceptance.tsx", {
    react: { ...runtime.react, useId: () => "acceptance-test" }, "react/jsx-runtime": virtualJsx,
    "@heroui/react": { Button: "Button", Checkbox: Object.assign(() => {}, { Content: "Checkbox.Content", Control: "Checkbox.Control", Indicator: "Checkbox.Indicator" }) },
    "./RegistrationPoliciesModal": { default: "RegistrationPoliciesModal", preloadRegistrationPolicyContent: () => preloads.push(true) }, "@/lib/registration-policies": policies,
  }).default;
  const render = () => runtime.render(() => Component({ value: accepted, onChange: value => changes.push(value) }));
  const modal = () => nodes(render()).find(node => node.type === "RegistrationPoliciesModal");
  assert.equal(modal().props.policy, null);
  const trigger = nodes(render()).find(node => node.type === "Button");
  trigger.props.onHoverStart(); trigger.props.onFocus();
  assert.equal(preloads.length, 2);
  assert.equal(modal().props.policy, null);
  assert.deepEqual(changes, []);
  for (const [index, policy] of ["privacy", "terms"].entries()) {
    nodes(render()).filter(node => node.type === "Button")[index].props.onPress();
    assert.equal(modal().props.policy, policy);
    modal().props.onPolicyChange(policy === "privacy" ? "terms" : "privacy");
    assert.equal(modal().props.policy, policy === "privacy" ? "terms" : "privacy");
    modal().props.onClose();
    assert.equal(modal().props.policy, null);
    assert.deepEqual(changes, []);
    assert.ok(nodes(render()).filter(node => node.props?.type === "hidden" && /Accepted$/.test(node.props.name)).every(node => node.props.value === "true"));
  }
});

function formHarness(kind, server = {}) {
  const runtime = hookRuntime();
  let serverState = server;
  const parts = keys => Object.assign(() => {}, Object.fromEntries(keys.map(key => [key, key])));
  const deps = {
    react: { ...runtime.react, useActionState: () => [serverState, () => {}, false] }, "react/jsx-runtime": virtualJsx,
    "@heroui/react": { TextField: "TextField", Input: "Input", Label: "Label", Button: "Button", Separator: "Separator", Spinner: "Spinner", Form: "Form", Select: parts(["Trigger", "Value", "Indicator", "Popover"]), ListBox: parts(["Item", "ItemIndicator"]), useOverlayState: () => ({ isOpen: false, open() {}, close() {} }) },
    "@repo/constants": { GENDERS: ["Male"], SUFFIXES: [], sanitizePHMobileInput: value => value, getPasswordRequirements: () => [] },
    "@/lib/birth-date": { validateBirthDate: () => null }, "@/lib/registration-address": addressRules,
    "@/lib/registration-policies": policies,
    "../../components/RegistrationPolicyAcceptance": { default: "RegistrationPolicyAcceptance" },
    "../../components/RegistrationAddressFields": { default: "RegistrationAddressFields" },
    "../../components/RegistrationBirthDateField": { default: "RegistrationBirthDateField" },
    "../../actions/complete-profile": { completeProfile() {} },
    "../../components/AuthContext": { useAuth: () => ({ role: "tenant", email: "test@example.com" }) },
    "next/link": { default: "Link" }, "@/app/components/inputs/PasswordField": { default: "PasswordField" }, "@/app/components/inputs/PasswordRequirementList": { default: "PasswordRequirementList" },
    "./OtpModal": { default: "OtpModal" }, "./SuccessModal": { default: "SuccessModal" }, "./ErrorModal": { default: "ErrorModal" },
    "../hooks/useOtpFlow": { useOtpFlow: () => ({}) }, "../utils": { validateSignUpForm: () => null }, "../../actions/send-otp": { sendEmailOtp: async () => ({ success: true }) },
  };
  const Component = compile(kind === "complete" ? "app/(auth)/complete-profile/components/CompleteProfileForm.tsx" : "app/(auth)/sign-up-form/components/SignUpForm.tsx", deps).default;
  const render = () => runtime.render(() => Component({ role: "tenant", initialAddress: validAddress, initialBirthDate: "2000-01-01" }));
  const consent = () => nodes(render()).find(node => node.type === "RegistrationPolicyAcceptance");
  const button = () => nodes(render()).find(node => node.type === "Button" && node.props.type === "submit");
  return { render, consent, button, server: value => { serverState = value; } };
}

for (const kind of ["regular", "complete"]) {
  test(`${kind}: submit stays disabled until both are checked, and a fresh visit never remembers checks`, () => {
    const h = formHarness(kind);
    assert.equal(h.button().props.isDisabled, true);
    h.consent().props.onChange({ ...policies.emptyRegistrationAcceptance(), privacyAccepted: true });
    assert.equal(h.button().props.isDisabled, true);
    h.consent().props.onChange(accepted);
    assert.equal(!!h.button().props.isDisabled, false);
    h.consent().props.onChange({ ...accepted, privacyAccepted: false });
    assert.equal(h.button().props.isDisabled, true);
    assert.equal(formHarness(kind).button().props.isDisabled, true);
  });
}

test("Complete Profile clears selected policies when the server reports stale/missing acceptance", () => {
  const h = formHarness("complete");
  h.consent().props.onChange(accepted);
  h.server({ acceptanceErrors: { version: "Review updated policies." } });
  h.render();
  assert.equal(h.button().props.isDisabled, true);
  assert.equal(h.consent().props.value.termsAccepted, false);
  assert.equal(h.consent().props.errors.version, "Review updated policies.");
});

function submission() {
  const fd = new FormData();
  for (const [key, value] of Object.entries({ role: "tenant", userId: "caller", firstName: "Test", lastName: "User", birthDate: "2000-01-01", mobileNumber: "09171234567", first_name: "Test", last_name: "User", birth_date: "2000-01-01", gender: "Male", mobile_number: "09171234567", street_address: validAddress.streetAddress, barangay: validAddress.barangay, city: validAddress.city, province: validAddress.province, postal_code: validAddress.postalCode })) fd.set(key, value);
  return fd;
}

function actionHarness(kind, options = {}) {
  const requests = [], signup = [];
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: options.profile ?? { roles: ["tenant"], account_status: "unverified", mobile_number: null }, error: null }) };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "caller", email: "caller@example.test" } } }), signUp: async args => { signup.push(args); return { error: null }; } },
    from: () => q,
    rpc: async (...args) => {
      requests.push(args);
      if (options.throw) throw new Error("Network unavailable");
      return { error: options.error ?? null };
    },
  };
  const service = compile("service/registrationService.ts", {});
  const action = compile(`app/(auth)/actions/${kind}.ts`, {
    "@repo/supabase/server": { createClient: async () => client }, "@/lib/registration-policies": policies, "@/service/registrationService": service,
    "@repo/constants": { SUFFIXES: [], GENDERS: ["Male"], validatePHMobile: () => ({ formattedNumber: "09171234567" }) },
    "@/lib/birth-date": { validateBirthDate: () => null, getBirthDateDatabaseError: () => null }, "@/lib/registration-address": addressRules,
    "../sign-up-form/utils": { validateSignUpForm: () => null }, "@repo/utils": { getEmailCodeRequestError: message => message },
    "next/headers": { cookies: async () => ({ set() {} }) }, "next/navigation": { redirect: path => { throw new Error(`redirect:${path}`); } },
    "@/lib/portal-preference": { PORTAL_COOKIE: "portal" },
  }, { process: { env: { NODE_ENV: "test" } } });
  const submit = (acceptance, mutate) => {
    if (kind === "send-otp") return action.sendEmailOtp("test@example.test", "Password1!", "Test", "User", "2000-01-01", acceptance);
    const fd = submission();
    if (acceptance) policies.writeRegistrationAcceptance(fd, acceptance);
    mutate?.(fd);
    return kind === "sign-up" ? action.signUp({ success: false, error: null }, fd) : action.completeProfile({}, fd);
  };
  return { requests, signup, submit };
}

for (const kind of ["send-otp", "sign-up", "complete-profile"]) {
  test(`${kind}: server rejects missing, unchecked and stale policies before any registration write`, async () => {
    const h = actionHarness(kind);
    for (const acceptance of [undefined, policies.emptyRegistrationAcceptance(), { ...accepted, termsAccepted: false }, { ...accepted, privacyAccepted: false }, { ...accepted, termsVersion: "old" }]) {
      const result = await h.submit(acceptance);
      assert.ok(Object.keys(result.acceptanceErrors).length);
      assert.equal(h.requests.length + h.signup.length, 0);
    }
  });
}

test("valid actions send only an atomic caller-bound registration request and never identity/access fields", async () => {
  for (const kind of ["sign-up", "complete-profile"]) {
    const h = actionHarness(kind);
    if (kind === "sign-up") assert.equal((await h.submit(accepted)).success, true);
    else await assert.rejects(h.submit(accepted), /redirect:\/tenant\/personalize/);
    assert.equal(h.requests.length, 1);
    const [name, args] = h.requests[0];
    assert.equal(name, "complete_web_registration");
    assert.equal(args.terms_accepted, true); assert.equal(args.privacy_accepted, true);
    assert.equal(args.terms_version, accepted.termsVersion); assert.equal(args.privacy_version, accepted.privacyVersion);
    assert.equal(args.registration_source, kind === "sign-up" ? "web_registration" : "web_profile_completion");
    for (const field of ["user_id", "id", "roles", "account_status", "email", "accepted_at"]) assert.equal(args.profile_details[field], undefined);
  }
});

test("failed storage cannot report signup success or redirect Complete Profile", async () => {
  for (const kind of ["sign-up", "complete-profile"]) {
    const h = actionHarness(kind, { error: { message: "Storage unavailable", code: "P0001" } });
    const result = await h.submit(accepted);
    assert.ok(result.error); assert.notEqual(result.success, true);
  }
});

test("Complete Profile delegates completed retries and legacy rejection to the transaction", async () => {
  const profile = { roles: ["tenant"], account_status: "unverified", mobile_number: "09171234567" };
  const retry = actionHarness("complete-profile", { profile });
  await assert.rejects(retry.submit(accepted), /redirect:\/tenant\/personalize/);
  assert.equal(retry.requests[0][0], "complete_web_registration");
  const legacy = actionHarness("complete-profile", { profile, error: { code: "P0001", message: "Profile setup is no longer available for this account." } });
  assert.equal((await legacy.submit(accepted)).error, "Profile setup is no longer available for this account.");
});

test("a thrown transport failure becomes a safe retryable error, never a crash or profile-only fallback", async () => {
  for (const kind of ["sign-up", "complete-profile"]) {
    const h = actionHarness(kind, { throw: true });
    const result = await h.submit(accepted);
    assert.ok(result.error); assert.notEqual(result.success, true);
    assert.equal(h.requests.length, 1);
  }
});

test("database policy revisions become inline acceptance errors, not a generic success or redirect", async () => {
  for (const kind of ["sign-up", "complete-profile"]) {
    const h = actionHarness(kind, { error: { message: "The policies have changed. Reload this page, review the current policies, and accept them again.", code: "P0001" } });
    const result = await h.submit(accepted);
    assert.ok(result.acceptanceErrors.version);
    assert.notEqual(result.success, true);
  }
});

test("email resend/final verification carry acceptance; stale policies after verification end the live session", async () => {
  const runtime = hookRuntime();
  const requests = [], resends = [], failures = [], signedOut = [];
  const flow = compile("app/(auth)/sign-up-form/hooks/useOtpFlow.ts", {
    react: runtime.react, "@/lib/registration-policies": policies,
    "../../hooks/use-resend-cooldown": { useResendCooldown: () => ({ cooldown: 0, start() {}, stop() {}, format() {} }) },
    "../../hooks/use-otp-attempts": { useOtpAttempts: () => ({ recordWrongCode() {}, reset() {} }) },
    "@repo/supabase/browser": { createClient: () => ({ auth: { verifyOtp: async () => ({ data: { user: { id: "caller" } } }), signOut: async () => signedOut.push(true) } }) },
    "@repo/utils": { getOtpAttemptError: () => "wrong code" },
    "../../actions/send-otp": { sendEmailOtp: async (...args) => { resends.push(args); return { success: true }; } },
    "../../actions/sign-up": { signUp: async (_, fd) => { requests.push(fd); return { acceptanceErrors: { version: "Review current policies." } }; } },
  }, { FormData });
  const hook = runtime.render(() => flow.useOtpFlow({
    formData: { email: "test@example.test", birthDate: "2000-01-01", postalCode: 1485 }, role: "tenant", acceptance: accepted,
    showError: () => assert.fail("policy errors must stay inline"), onSuccessOpen: () => assert.fail("must not succeed"),
    onBirthDateError() {}, onAcceptanceError: (...args) => failures.push(args),
  }));
  runtime.flush();
  await hook.handleResendOtp();
  assert.deepEqual(resends[0][5], accepted);
  await hook.handleVerifyOtp(() => {});
  assert.deepEqual(policies.readRegistrationAcceptance(requests[0]), accepted);
  assert.equal(signedOut.length, 1);
  assert.equal(failures[0][1], true, "the form must offer sign-in-to-finish for the now-verified email");
});

test("existing OAuth callback and server guards keep incomplete accounts in onboarding without testing legacy accounts for acceptance", () => {
  const callback = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
  const guard = readFileSync(new URL("./server-identity.ts", import.meta.url), "utf8");
  assert.match(callback, /isInitialGoogleOnboarding/);
  assert.match(callback, /\/complete-profile/);
  assert.match(guard, /if \(isPendingOnboarding\(profile\)\) redirect/);
  assert.doesNotMatch(callback + guard, /policy_acceptances/);
});
