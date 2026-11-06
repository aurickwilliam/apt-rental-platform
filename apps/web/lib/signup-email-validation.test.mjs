import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as HeroUI from "@heroui/react";
import NextLink from "next/link.js";
import { compile, deferred, hookRuntime } from "./test-support/hook-runtime.mjs";

const conflictMessage = "This email is already registered.";
const networkMessage = "Could not validate your email right now. Please try again.";
const file = "app/(auth)/components/AuthForm.tsx";
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const text = value => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" ? text(value.props?.children) : "";
};

function harness(options = {}) {
  const runtime = hookRuntime();
  const requests = [], navigation = [], logs = [], dispatched = [];
  const context = {
    type: options.type ?? "sign-up", role: options.role ?? "tenant", email: options.email ?? "existing@example.com",
    setEmail: value => { context.email = value; },
  };
  const router = { push: value => navigation.push(value) };
  const ui = options.realUI ? HeroUI : Object.fromEntries(["Form", "Input", "Link", "Button", "TextField", "FieldError", "Label"].map(name => [name, name]));
  const component = compile(file, {
    react: { ...runtime.react, startTransition: callback => callback(), useActionState: () => [options.signInState ?? { error: null }, formData => dispatched.push(formData), options.pending ?? false] },
    "react/jsx-runtime": options.realUI ? { jsx, jsxs, Fragment } : { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "Fragment" },
    "next/navigation": { useRouter: () => router },
    "next/link": { default: options.realUI ? NextLink : "NextLink" },
    "@/app/components/inputs/PasswordField": { default: "PasswordField" },
    "@/app/components/inputs/TurnstileWidget": { default: "TurnstileWidget" }, "@/hooks/use-captcha": { useCaptcha: () => ({ attach() {}, take: () => ({ pending: false }) }) }, "@repo/utils": { CAPTCHA_PENDING_MESSAGE: "pending", formatLockoutClock: seconds => String(seconds) },
    "@/hooks/use-auth-lockout": { useAuthLockout: () => options.lockout ?? { secondsLeft: 0, isLocked: false, lock() {}, modalOpen: false, setModalOpen() {} } },
    "./AuthLockoutModal": { default: "AuthLockoutModal" },
    "./AuthContext": { useAuth: () => context },
    "../actions/sign-in": { signIn: () => {} },
    "../actions/check-email-availability": { checkEmailAvailability: async email => {
      requests.push(email);
      return options.check ? options.check(email) : { exists: true, error: null };
    } },
    "../hooks/use-confirm-email": { useConfirmEmail: () => ({ open() {} }) },
    "../sign-up-form/components/OtpModal": { default: "OtpModal" },
    "@heroui/react": ui,
  }, {
    FormData: class extends Map { constructor(form) { super(Object.entries(form)); } },
    console: { error: (...args) => logs.push(args) },
  }).default;
  const render = () => runtime.render(() => component({ next: options.next }));
  const field = () => nodes(render()).find(node => node.props?.name === "email");
  const error = details => nodes(field()).find(node => node.type === "FieldError").props.children({ validationDetails: { valueMissing: false, typeMismatch: false, ...details } });
  return { render, field, error, requests, navigation, logs, dispatched,
    change(value) { field().props.onChange(value); },
    async submit() {
      let prevented = false;
      const form = nodes(render()).find(node => node.type === (options.realUI ? HeroUI.Form : "Form"));
      await form.props.onSubmit({ currentTarget: { email: context.email }, preventDefault() { prevented = true; } });
      return prevented;
    },
  };
}

for (const role of ["tenant", "landlord"]) {
  test(`${role}: registered email renders only inline with safe sign-in guidance`, async () => {
    const h = harness({ role });
    assert.equal(await h.submit(), true);
    assert.equal(h.field().props.isInvalid, true);
    assert.equal(text(h.error()), "This email is already registered.Sign in to your existing account to add another role.");
    const link = nodes(h.error()).find(node => node.type === "NextLink");
    assert.equal(link.props.href, "/sign-in");
    assert.match(link.props.className, /underline/);
    assert.equal(nodes(h.render()).filter(node => node.props?.className?.includes("bg-red-200")).length, 0);
    assert.deepEqual(h.navigation, []);
    assert.deepEqual(h.requests, ["existing@example.com"]);
    const button = nodes(h.render()).find(node => node.type === "Button");
    assert.equal(button.props.isDisabled, false);
    assert.equal(button.props.children, "Sign Up");
  });

  test(`${role}: valid available email retains the existing registration destination`, async () => {
    const h = harness({ role, email: " New+user@example.com ", check: async () => ({ exists: false, error: null }) });
    await h.submit();
    assert.deepEqual(h.requests, ["New+user@example.com"]);
    assert.deepEqual(h.navigation, [`/sign-up-form?role=${role}&email=New%2Buser%40example.com`]);
    assert.equal(h.field().props.isInvalid, undefined);
  });
}

test("editing clears stale conflicts without a request, and native format/required errors remain distinct", async () => {
  const h = harness();
  await h.submit();
  h.change("not-an-email");
  assert.equal(h.field().props.isInvalid, undefined);
  assert.equal(text(h.error({ typeMismatch: true })), "Enter a valid email");
  h.change("");
  assert.equal(text(h.error({ valueMissing: true })), "Email is required");
  assert.equal(h.requests.length, 1, "edits do not check the database");
  await h.submit();
  assert.equal(h.field().props.isInvalid, true);
  assert.equal(text(h.error()), "Email is required");
  assert.equal(h.requests.length, 1, "empty submission makes no request");
  h.change("new@example.com");
  assert.equal(h.error(), null);
  assert.equal(h.field().props.type, "email");
  assert.equal(h.field().props.isRequired, true);
});

test("returned server failures and thrown network failures remain form-level and release the pending state", async () => {
  for (const check of [
    async () => ({ exists: false, error: networkMessage }),
    async () => ({ exists: true, error: networkMessage }),
    async () => { throw new Error("connection failed"); },
  ]) {
    const h = harness({ check });
    await h.submit();
    const banner = nodes(h.render()).find(node => node.props?.className?.includes("bg-red-200"));
    assert.equal(text(banner), networkMessage);
    assert.equal(h.error(), null);
    assert.equal(h.field().props.isInvalid, undefined);
    assert.equal(nodes(h.render()).find(node => node.type === "Button").props.isDisabled, false);
    assert.deepEqual(h.navigation, []);
  }
});

test("pending availability check disables Email and Sign Up until the response settles", async () => {
  const response = deferred();
  const h = harness({ check: () => response.promise });
  const pending = h.submit();
  assert.equal(h.field().props.isDisabled, true);
  const button = nodes(h.render()).find(node => node.type === "Button");
  assert.equal(button.props.isPending, true); assert.equal(button.props.isDisabled, true);
  assert.equal(button.props.children, "Checking Email...");
  response.resolve({ exists: true, error: null });
  await pending;
  assert.equal(h.field().props.isDisabled, false);
});

test("sign-in still uses its server action, provider errors, password and supported verification next", async () => {
  const h = harness({ type: "sign-in", signInState: { error: "Invalid login or provider failure", needsEmailConfirmation: true }, next: "/verify/mobile?token=opaque" });
  // The form dispatches the server action itself (no form `action`, so React never resets the fields).
  assert.equal(await h.submit(), true);
  assert.equal(h.dispatched.length, 1);
  assert.equal(h.requests.length, 0);
  const root = h.render();
  assert.equal(nodes(root).filter(node => node.type === "PasswordField").length, 1);
  assert.equal(nodes(root).find(node => node.type === "Form").props.action, undefined);
  assert.equal(nodes(root).find(node => node.props?.name === "next").props.value, "/verify/mobile?token=opaque");
  assert.match(text(nodes(root).find(node => node.props?.className?.includes("bg-red-200"))), /Invalid login or provider failure.*Send me a new code/);
});

test("native HeroUI markup exposes the conflict as an accessible field error and keyboard link", async () => {
  const h = harness({ realUI: true });
  await h.submit();
  const html = renderToStaticMarkup(h.render());
  const input = html.match(/<input[^>]*type="email"[^>]*>/)?.[0];
  assert.ok(input); assert.match(input, /aria-invalid="true"/);
  assert.match(input, /required=""/);
  const error = html.match(/<[^>]*data-slot="field-error"[^>]*>/)?.[0];
  const id = error?.match(/\bid="([^"]+)"/)?.[1];
  assert.ok(id);
  assert.ok(input.match(/aria-describedby="([^"]+)"/)?.[1].split(" ").includes(id));
  const link = html.match(/<a[^>]*href="\/sign-in"[^>]*>/)?.[0];
  assert.ok(link); assert.doesNotMatch(link, /tabindex="-1"|aria-disabled="true"/);
  assert.equal(html.split(conflictMessage).length - 1, 1);
  assert.doesNotMatch(html, /bg-red-200/);
});

test("inline styling uses existing theme-aware tokens and keeps the responsive form and button spacing", async () => {
  const h = harness();
  const before = nodes(h.render()).find(node => node.type === "Form").props.className;
  await h.submit();
  assert.equal(nodes(h.render()).find(node => node.type === "Form").props.className, before);
  const field = h.field();
  assert.deepEqual(Array.from(field.props.children, node => node.type), ["Label", "Input", "FieldError"]);
  assert.equal(nodes(field).find(node => node.type === "FieldError").props.className, "text-xs");
  assert.match(nodes(h.error()).find(node => node.props?.className?.includes("text-muted-foreground")).props.className, /mt-1 block/);
  assert.match(nodes(h.error()).find(node => node.type === "NextLink").props.className, /text-brand/);
  assert.match(nodes(h.render()).find(node => node.type === "Button").props.className, /w-full mt-\[clamp/);
});

test("server duplicate detection still normalizes once, trusts only an explicit true and does not create accounts or grant roles", async () => {
  for (const [registered, error, expected] of [[true, null, true], [false, null, false], [null, null, false], [true, { code: "failed" }, false]]) {
    const calls = [];
    const { checkEmailAvailability } = compile("app/(auth)/actions/check-email-availability.ts", {
      "@repo/supabase/server": { createClient: async () => ({ rpc: async (...args) => { calls.push(args); return { data: registered, error }; } }) },
    });
    const result = await checkEmailAvailability(" Existing@Example.com ");
    assert.equal(result.exists, expected);
    assert.equal(result.error, error ? networkMessage : null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "is_email_registered");
    assert.equal(calls[0][1].p_email, "existing@example.com");
    await checkEmailAvailability("");
    assert.equal(calls.length, 1);
  }
});

test("the existing auth footer remains a separate sign-in link", () => {
  const source = readFileSync(new URL("../app/(auth)/components/BottomLinks.tsx", import.meta.url), "utf8");
  assert.match(source, /Already have an account/);
  assert.match(source, /\/sign-in/);
});

test("sign-in: a lock disables Sign in with a countdown and opens the lockout modal", () => {
  const h = harness({
    type: "sign-in",
    lockout: { secondsLeft: 125, isLocked: true, lock() {}, modalOpen: true, setModalOpen() {} },
  });
  const tree = nodes(h.render());
  const button = tree.find(node => node.type === "Button");
  assert.equal(button.props.isDisabled, true);
  assert.equal(text(button.props.children), "Try again in 125");
  const modal = tree.find(node => node.type === "AuthLockoutModal");
  assert.equal(modal.props.isOpen, true);
  assert.equal(modal.props.secondsLeft, 125);
});

test("sign-in: without a lock the button works and the modal stays closed", () => {
  const h = harness({ type: "sign-in" });
  const tree = nodes(h.render());
  const button = tree.find(node => node.type === "Button");
  assert.equal(button.props.isDisabled, false);
  assert.equal(text(button.props.children), "Sign In");
  assert.equal(tree.find(node => node.type === "AuthLockoutModal").props.isOpen, false);
});

test("sign-in: a lock is explained by the modal, never by a red banner", () => {
  const h = harness({
    type: "sign-in",
    signInState: { error: "Too many sign-in attempts. Please try again in a few minutes.", lockedForSeconds: 900 },
  });
  assert.ok(!text(h.render()).includes("Too many sign-in attempts"));
  const plain = harness({ type: "sign-in", signInState: { error: "Invalid email or password. Please try again." } });
  assert.ok(text(plain.render()).includes("Invalid email or password"));
});

test("the sign-up lock never touches the sign-up form", () => {
  const h = harness({
    type: "sign-up",
    lockout: { secondsLeft: 125, isLocked: true, lock() {}, modalOpen: true, setModalOpen() {} },
  });
  const button = nodes(h.render()).find(node => node.type === "Button");
  assert.equal(text(button.props.children), "Sign Up");
  assert.equal(button.props.isDisabled, false);
});

test("sign-in: the form dispatches the action itself so React never resets the email or the lock", async () => {
  const h = harness({ type: "sign-in" });
  const form = nodes(h.render()).find(node => node.type === "Form");
  // A form `action` makes React reset the form after every attempt: that wiped the email, and the
  // lock is keyed by the email, so the modal closed and the button re-enabled right after the lock.
  assert.equal(form.props.action, undefined);

  let prevented = false;
  await form.props.onSubmit({ currentTarget: { email: "ana@example.com", password: "secret", role: "tenant" }, preventDefault() { prevented = true; } });

  assert.equal(prevented, true, "the browser's own submit is stopped");
  assert.equal(h.dispatched.length, 1, "the sign-in action runs exactly once");
  assert.equal(h.dispatched[0].get("email"), "ana@example.com");
  assert.equal(h.dispatched[0].get("password"), "secret");
  assert.equal(h.requests.length, 0, "sign-in never goes through the sign-up email check");
});

test("sign-up: the submit is still intercepted and never dispatches the sign-in action", async () => {
  const h = harness({ type: "sign-up", check: async () => ({ exists: false, error: null }) });
  const prevented = await h.submit();
  assert.equal(prevented, true);
  assert.equal(h.dispatched.length, 0);
});
