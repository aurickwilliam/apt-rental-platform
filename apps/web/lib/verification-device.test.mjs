import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { classifyVerificationDevice } from "./verification-device.ts";
import { verificationApartmentPath } from "./profile-verification-navigation.ts";

const desktop = { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", platform: "Win32", maxTouchPoints: 0, coarsePointer: false, screenShortEdge: 900 };
for (const [label, signals, expected] of [
  ["desktop", desktop, "desktop"],
  ["narrow desktop is not a phone", { ...desktop, screenShortEdge: 390 }, "desktop"],
  ["Windows touch laptop", { ...desktop, maxTouchPoints: 10, coarsePointer: true, screenShortEdge: 540 }, "desktop"],
  ["Android phone", { ...desktop, userAgent: "Mozilla/5.0 (Linux; Android 15) Mobile", platform: "Linux armv8l", maxTouchPoints: 5, coarsePointer: true }, "android"],
  ["Android tablet", { ...desktop, userAgent: "Mozilla/5.0 (Linux; Android 15)", platform: "Linux armv8l", maxTouchPoints: 5, coarsePointer: true }, "android"],
  ["Android client hints in desktop mode", { ...desktop, clientHints: { mobile: false, platform: "Android" } }, "android"],
  ["iPhone Safari", { ...desktop, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 }, "ios"],
  ["iPad desktop-mode Safari", { ...desktop, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", platform: "MacIntel", maxTouchPoints: 5, coarsePointer: true }, "ios"],
  ["Mac laptop", { ...desktop, platform: "MacIntel" }, "desktop"],
  ["generic mobile client hint", { ...desktop, clientHints: { mobile: true } }, "mobile"],
  ["touch phone with masked desktop UA", { ...desktop, platform: "Linux armv8l", maxTouchPoints: 5, coarsePointer: true, screenShortEdge: 390 }, "mobile"],
  ["large unknown touch desktop", { ...desktop, platform: "Linux x86_64", maxTouchPoints: 5, coarsePointer: true }, "desktop"],
]) {
  test(`verification device: ${label}`, () => assert.equal(classifyVerificationDevice(signals), expected));
}

test("same-device navigation always uses the relative authenticated mobile entry with an encoded token", () => {
  const exports = {};
  const source = readFileSync(new URL("./mobile-verification-navigation.ts", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, URLSearchParams, require: () => ({ verificationApartmentPath }),
  });
  for (const [input, expected] of [["/tenant/browse/unit-1", "/tenant/browse/unit-1"], ["/browse/unit-1/apply", "/browse/unit-1"], ["https://evil.test", null], ["//evil.test", null], ["/tenant/profile?openVerification=true", null]]) {
    const url = new URL(exports.mobileVerificationHref("opaque&token", input), "https://apt.test");
    assert.equal(url.origin, "https://apt.test");
    assert.equal(url.pathname, "/verify/mobile");
    assert.equal(url.searchParams.get("token"), "opaque&token");
    assert.equal(url.searchParams.get("returnTo"), expected);
  }
});

test("mobile page validates returnTo before passing it to capture/auth-resume or rendering a link", async () => {
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "Link" },
    "@heroui/react": { Card: Object.assign("Card", { Content: "Content" }) },
    "@/lib/profile-verification-navigation": { verificationApartmentPath },
    "./components/MobileVerifyClient": { default: "MobileVerifyClient" },
    "./verification.css": {},
  };
  const source = readFileSync(new URL("../app/verify/mobile/page.tsx", import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; },
  });
  for (const [returnTo, expected] of [["/tenant/browse/unit-1", "/tenant/browse/unit-1"], ["https://evil.test", null], [["/tenant/browse/unit-1"], null]]) {
    const tree = await exports.default({ searchParams: Promise.resolve({ token: "a".repeat(43), returnTo }) });
    assert.equal(tree.props.children[0].props.returnTo, expected);
    if (expected) assert.equal(tree.props.children[1].props.href, expected);
    else assert.equal(tree.props.children[1], null);
  }
});
