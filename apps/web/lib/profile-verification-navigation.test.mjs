import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import { profileVerificationHref, verificationApartmentPath } from "./profile-verification-navigation.ts";

test("verification intent targets tenant profile and retains only the apartment detail path", () => {
  for (const prefix of ["/browse", "/tenant/browse"]) {
    for (const suffix of ["", "/apply"]) {
      const url = new URL(profileVerificationHref(`${prefix}/apartment-1${suffix}`), "https://apt.test");
      assert.equal(url.pathname, "/tenant/profile");
      assert.equal(url.searchParams.get("openVerification"), "true");
      assert.equal(url.searchParams.get("returnTo"), `${prefix}/apartment-1`);
    }
  }
});

test("return paths reject external URLs, unrelated routes, queries, hashes and encoded paths", () => {
  for (const path of [null, "", "https://evil.test/browse/id", "//evil.test", "/tenant/profile", "/verify", "/browse/id?draft=private", "/browse/id#hash", "/browse/../profile", "/browse/%2f%2fevil.test", "/browse/id/extra", "/tenant/browse/id\\evil"]) {
    assert.equal(verificationApartmentPath(path), null, String(path));
    assert.equal(profileVerificationHref(path), "/tenant/profile?openVerification=true");
  }
});

function issuesTree(accountStatus, issues = [{ code: "unverified", message: "Verify your identity." }]) {
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "Link" },
    "next/navigation": { usePathname: () => "/tenant/browse/apartment-1" },
    "@heroui/react": { buttonVariants: () => "" },
    "@tabler/icons-react": { IconAlertTriangle: "Icon" },
    "@/app/components/passport/passportSlots": { passportFixHref: () => "/tenant/passport?add=Proof%20of%20Income" },
    "@/lib/profile-verification-navigation": { profileVerificationHref },
  };
  const source = readFileSync(new URL("../app/browse/[apartmentId]/apply/components/ApplicationIssues.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require: name => {
    assert.ok(dependencies[name], name);
    return dependencies[name];
  } });
  return exports.default({ issues, accountStatus });
}

function nodes(tree) {
  return tree && typeof tree === "object" ? [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)] : [];
}

test("unverified and rejected application actions use the profile's one-shot verification intent", () => {
  for (const status of ["unverified", "rejected", null]) {
    const link = nodes(issuesTree(status)).find(node => node.type === "Link");
    assert.equal(link.props.children, "Verify account");
    assert.equal(link.props.href, profileVerificationHref("/tenant/browse/apartment-1"));
  }
});

test("pending application action offers existing status; verified accounts are not offered verification", () => {
  const pending = nodes(issuesTree("pending")).find(node => node.type === "Link");
  assert.equal(pending.props.children, "View verification status");
  assert.equal(nodes(issuesTree("verified")).filter(node => node.type === "Link").length, 0);
});

test("Passport document and application fixes are unchanged", () => {
  for (const [code, href] of [["passport-missing", "/tenant/passport"], ["passport-expired", "/tenant/passport"], ["already-applied", "/tenant/my-rental"]]) {
    assert.equal(nodes(issuesTree("verified", [{ code, message: "Issue" }])).find(node => node.type === "Link").props.href, href);
  }
});
