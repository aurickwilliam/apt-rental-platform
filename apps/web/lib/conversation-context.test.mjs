import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { conversationApartmentPresentation as present } from "./conversation-context.ts";

const property = (id, overrides = {}) => ({
  id, name: `Property ${id}`, barangay: "Sangandaan", city: "Caloocan",
  monthly_rent: 25000, apartment_images: [], ...overrides,
});

test("same participant's properties retain exact identity and portal-specific routes", () => {
  for (const portal of ["tenant", "landlord"]) {
    for (const id of ["first", "second"]) {
      const result = present(id, property(id), portal);
      assert.equal(result.title, `Property ${id}`);
      assert.equal(result.href, `/${portal}/${portal === "tenant" ? "browse" : "properties"}/${id}`);
    }
    assert.equal(present("second", property("first"), portal), null);
  }
});

test("missing/inaccessible/unlinked properties have no invented details or link", () => {
  assert.equal(present(null, null, "tenant"), null);
  assert.equal(present("deleted", null, "tenant"), null);
  assert.equal(present(null, property("first"), "landlord"), null);
});

test("context uses cover thumbnails and only real location/rent values", () => {
  const result = present("a", property("a", { apartment_images: [
    { url: "other", url_thumb: null, is_cover: false },
    { url: "cover", url_thumb: "thumb", is_cover: true },
  ] }), "tenant");
  assert.equal(result.image, "thumb");
  assert.equal(result.location, "Sangandaan, Caloocan");
  assert.equal(result.rent, 25000);
  for (const monthly_rent of [null, 0, -1, NaN, Infinity]) {
    const missing = present("a", property("a", { monthly_rent, barangay: null, city: null }), "tenant");
    assert.equal(missing.rent, null);
    assert.equal(missing.image, null);
    assert.equal(missing.location, "");
  }
});

function component(name, dependencies = {}) {
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../app/components/chat/${name}.tsx`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => ({
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: { useState: () => [null, () => {}] },
    "@heroui/react": { buttonVariants: () => "button" },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => name }),
    "@repo/utils": { formatPesoDisplay: (rent) => `₱${rent}` },
    ...dependencies,
  })[name] ?? { default: name } });
  return exports.default;
}
const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];

test("introduction only displays supported verification and available apartment actions", () => {
  const render = component("ConversationIntroduction");
  const contact = { name: "Alex Santos", avatar: "" };
  for (const role of ["Tenant", "Landlord"]) {
    for (const verified of [true, false]) {
      const tree = nodes(render({ contact, role, verified, apartment: null }));
      assert.equal(tree.filter((node) => node.props["aria-label"] === "Verified account").length, verified ? 1 : 0);
      assert.equal(tree.filter((node) => node.props.href).length, 0);
      assert.ok(tree.some((node) => node.props.children === "Keep payments inside APT, never through chat."));
    }
  }
  const apartment = present("a", property("a"), "tenant");
  const tree = nodes(render({ contact, role: "Landlord", verified: false, apartment }));
  assert.equal(tree.filter((node) => node.props.href).length, 1);
  assert.equal(tree.find((node) => node.props.href).props.href, apartment.href);
});

test("unavailable apartment row is not clickable; loading never invents rent", () => {
  const render = component("ConversationApartmentRow");
  for (const loading of [true, false]) {
    const tree = nodes(render({ apartment: null, hasApartmentId: true, loading }));
    assert.equal(tree.filter((node) => node.props.href).length, 0);
    assert.equal(tree[0].props["aria-busy"], loading);
    assert.ok(tree.some((node) => node.props.children === (loading ? "Loading apartment…" : "Apartment unavailable")));
  }
});

for (const portal of ["tenant", "landlord"]) {
  test(`${portal}: introduction is once at the true history start, inside the scroller`, () => {
    const source = readFileSync(new URL(`../app/${portal}/messages/components/ConversationView.tsx`, import.meta.url), "utf8");
    assert.equal(source.match(/<ConversationIntroduction /g).length, 1);
    assert.match(source, /!hasEarlierMessages \? <ConversationIntroduction/);
    assert.ok(source.indexOf("<ConversationIntroduction") > source.indexOf("<ScrollShadow"));
    assert.ok(source.indexOf("<ConversationIntroduction") < source.indexOf("messages.map"));
    assert.ok(source.indexOf("<ConversationApartmentRow") > source.indexOf("<ConversationHeader"));
    assert.doesNotMatch(source, /<ConversationIntroduction[^>]*role=/);
  });
}

function contextHookHarness() {
  let loader;
  let resource = { data: { apartment: property("old"), verified: true }, loading: true, error: null };
  const queries = [];
  const source = readFileSync(new URL("../hooks/use-conversation-context.ts", import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, console,
    require: (name) => ({
      react: { useCallback: (fn) => fn },
      "@/hooks/use-async-resource": { useAsyncResource: (load) => { loader = load; return resource; } },
      "@repo/supabase/browser": { createClient: () => ({ from: (table) => {
        const query = { table, filters: [] };
        queries.push(query);
        const builder = {
          select: () => builder,
          eq: (...args) => { query.filters.push(["eq", ...args]); return builder; },
          is: (...args) => { query.filters.push(["is", ...args]); return builder; },
          maybeSingle: async () => ({ data: table === "users" ? { account_status: "verified" } : property("selected"), error: null }),
        };
        return builder;
      } }) },
    })[name],
  });
  return { queries, render: (...args) => exports.useConversationContext(...args), load: () => loader(), setResource: (value) => { resource = value; } };
}

test("context reads only the exact apartment/owner and authoritative contact account", async () => {
  for (const portal of ["tenant", "landlord"]) {
    const h = contextHookHarness();
    h.render("peer", "selected", portal, "me");
    const result = await h.load();
    assert.equal(result.verified, true);
    const apartmentQuery = h.queries.find((query) => query.table === "apartments");
    const filters = JSON.stringify(apartmentQuery.filters);
    assert.ok(filters.includes('["eq","id","selected"]'));
    assert.ok(filters.includes(`["eq","landlord_id","${portal === "tenant" ? "peer" : "me"}"]`));
    assert.ok(filters.includes('["is","deleted_at",null]'));
    assert.equal(filters.includes("is_hidden_by_admin"), portal === "tenant");
    assert.equal(JSON.stringify(h.queries.find((query) => query.table === "users").filters), '[["eq","id","peer"]]');
  }
});

test("loading/error states suppress stale apartment and badge; null property never reads apartments", async () => {
  const h = contextHookHarness();
  let result = h.render("peer", "new", "tenant", "me");
  assert.equal(result.context.apartment, null);
  assert.equal(result.context.verified, false);
  h.setResource({ data: { apartment: property("old"), verified: true }, loading: false, error: "Unavailable" });
  result = h.render("peer", null, "tenant", "me");
  assert.equal(result.context.apartment, null);
  assert.equal(result.context.verified, false);
  await h.load();
  assert.equal(h.queries.filter((query) => query.table === "apartments").length, 0);
});
