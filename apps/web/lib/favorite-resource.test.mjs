import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { BrowserResourceCache, browserResourceId } from "./browser-resource-cache.ts";

const plain = value => JSON.parse(JSON.stringify(value));
function compile(file, modules) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: name => { assert.ok(name in modules, name); return modules[name]; } });
  return exports;
}
const scope = { authUserId: "auth-a", profileId: "profile-a" };
function fixture({ favorites = [], apartments = [], error = null } = {}) {
  const cache = new BrowserResourceCache();
  cache.setAccount("auth-a");
  const resource = compile("./favorite-resource.ts", { "./browser-resource-cache": { getBrowserResourceCache: () => cache } });
  const calls = [];
  const client = { from: table => {
    const call = { table, filters: [], orders: [] };
    calls.push(call);
    const query = {
      select: fields => { call.fields = fields; return query; },
      insert: data => { call.insert = data; return query; },
      delete: () => { call.delete = true; return query; },
      eq: (key, value) => { call.filters.push([key, value]); return query; },
      is: (key, value) => { call.filters.push([key, value]); return query; },
      gt: (key, value) => { call.filters.push([key, value]); return query; },
      in: (key, value) => { call.filters.push([key, Array.from(value)]); return query; },
      or: value => { call.filters.push(["or", value]); return query; },
      limit: (value, options) => { (call.limits ??= []).push([value, options]); return query; },
      order: (key, options) => { call.orders.push([key, options]); return query; },
      single: async () => ({ data: { id: "favorite-a" }, error }),
      then: (yes, no) => Promise.resolve({ data: table === "favorites" ? favorites : apartments, error }).then(yes, no),
    };
    return query;
  } };
  const service = compile("../service/favoritesService.ts", {
    "@repo/supabase/browser": { createClient: () => client },
    "@/lib/favorite-resource": resource,
  });
  return { cache, resource, service, calls, key: resource.favoritePresentationKey(scope, null) };
}

test("Favorite keys isolate account, profile and cursor while fixing the portal, projection and page size", () => {
  const h = fixture();
  assert.equal(h.key.portal, "tenant");
  assert.equal(h.key.params[1], 50);
  for (const [other, cursor] of [[{ ...scope, authUserId: "b" }, null], [{ ...scope, profileId: "b" }, null], [scope, { apartmentId: "b", createdAt: null }]]) {
    assert.notEqual(browserResourceId(h.key), browserResourceId(h.resource.favoritePresentationKey(other, cursor)));
  }
});

test("Favorite presentation is caller scoped, bounded, deduplicated and ordered; cards never query documents or verification", async () => {
  const h = fixture({ favorites: [{ apartment_id: "b" }, { apartment_id: "a" }, { apartment_id: "b" }], apartments: [{ id: "a" }, { id: "b" }] });
  const result = await h.service.fetchFavoritePresentation("profile-a", null);
  assert.deepEqual(plain(result.apartments.map(row => row.id)), ["b", "a"]);
  assert.deepEqual(h.calls[0].filters, [["tenant_id", "profile-a"]]);
  assert.equal(h.calls[0].limits[0][0], 51);
  assert.ok(h.calls[1].filters.some(([field, value]) => field === "is_hidden_by_admin" && value === false));
  assert.ok(h.calls[1].filters.some(([field, value]) => field === "deleted_at" && value === null));
  assert.deepEqual(plain(h.calls[1].limits), [[1, { referencedTable: "apartment_images" }]]);
  assert.doesNotMatch(h.calls[1].fields, /account_status|verification|documents|lease|payment/);
});

test("Favorite keyset paging leaves every later record reachable, including timestamp ties and legacy null dates", async () => {
  const h = fixture({ favorites: Array.from({ length: 51 }, (_, i) => ({ apartment_id: `apt-${i}`, created_at: "2026-10-01T00:00:00Z" })) });
  const result = await h.service.fetchFavoritePresentation("profile-a", null);
  assert.equal(result.nextCursor.apartmentId, "apt-49");
  await h.service.fetchFavoritePresentation("profile-a", result.nextCursor);
  assert.match(h.calls[2].filters.find(([field]) => field === "or")[1], /created_at\.eq.*apartment_id\.gt\.apt-49/);
  await h.service.fetchFavoritePresentation("profile-a", { apartmentId: "apt-last", createdAt: null });
  assert.ok(h.calls[4].filters.some(([field, value]) => field === "created_at" && value === null));
  assert.ok(h.calls[4].filters.some(([field, value]) => field === "apartment_id" && value === "apt-last"));
});

test("all favorite mutations invalidate retained pages; successful removal patches cards without a loading reset", async () => {
  const h = fixture();
  await h.cache.load(h.key, async () => ({ apartments: [{ id: "a" }, { id: "b" }], nextCursor: null }), "Failed");
  await h.service.deleteFavorite("profile-a", "a");
  const snapshot = h.cache.getSnapshot(h.key);
  assert.deepEqual(plain(snapshot.data.apartments), [{ id: "b" }]);
  assert.equal(snapshot.loading, false);
  assert.equal(snapshot.revision, 1);
  await h.service.insertFavorite("profile-a", "c");
  assert.equal(h.cache.getSnapshot(h.key).revision, 2);
});

test("failed favorite mutations don't invalidate, and unrelated profiles/portals remain untouched", async () => {
  const h = fixture({ error: { message: "Denied" } });
  await h.cache.load(h.key, async () => ({ apartments: [{ id: "a" }], nextCursor: null }), "Failed");
  const snapshot = h.cache.getSnapshot(h.key);
  await assert.rejects(h.service.deleteFavorite("profile-a", "a"));
  assert.equal(h.cache.getSnapshot(h.key), snapshot);
  h.resource.invalidateFavoritePresentation("profile-b", "a");
  assert.equal(h.cache.getSnapshot(h.key), snapshot);
});

test("retained Favorites cards never authorize a mutation: the hook checks fresh tenant context", async () => {
  for (const tenantId of [null, "profile-b", "profile-a"]) {
    const deletes = [];
    const hook = compile("../hooks/use-favorite-presentation.ts", {
      react: { useCallback: fn => fn },
      "@/lib/favorite-resource": { favoritePresentationKey: () => ({}) },
      "@/hooks/use-browser-resource": { useBrowserResource: () => ({ data: { apartments: [{ id: "a" }] } }) },
      "@/service/favoritesService": {
        getTenantContext: async () => ({ tenantId }),
        deleteFavorite: async (...args) => deletes.push(args),
      },
    });
    const result = hook.useFavoritePresentation(scope, null);
    if (tenantId === "profile-a") {
      assert.equal(await result.toggleFavorite("a"), false);
      assert.deepEqual(deletes, [["profile-a", "a"]]);
    } else {
      await assert.rejects(result.toggleFavorite("a"), /sign in/);
      assert.deepEqual(deletes, []);
    }
  }
});
