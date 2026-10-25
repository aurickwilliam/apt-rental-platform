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
  const requests = [], navigation = [], logs = [];
  const context = {
    type: options.type ?? "sign-up", role: options.role ?? "tenant", email: options.email ?? "existing@example.com",
    setEmail: value => { context.email = value; },
  };
  const router = { push: value => navigation.push(value) };
  const ui = options.realUI ? HeroUI : Object.fromEntries(["Form", "Input", "Link", "Button", "TextField", "FieldError", "Label"].map(name => [name, name]));
  const component = compile(file, {
    react: { ...runtime.react, useActionState: () => [options.signInState ?? { error: null }, () => {}, options.pending ?? false] },
    "react/jsx-runtime": options.realUI ? { jsx, jsxs, Fragment } : { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "Fragment" },
    "next/navigation": { useRouter: () => router },
    "next/link": { default: options.realUI ? NextLink : "NextLink" },
    "@/app/components/inputs/PasswordField": { default: "PasswordField" },
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
  return { render, field, error, requests, navigation, logs,
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
  assert.equal(await h.submit(), false);
  assert.equal(h.requests.length, 0);
  const root = h.render();
  assert.equal(nodes(root).filter(node => node.type === "PasswordField").length, 1);
  assert.ok(nodes(root).find(node => node.type === "Form").props.action);
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
