import assert from "node:assert/strict";
import test from "node:test";

import { fetchVerifiedLandlordIds } from "./verified-landlord.ts";

const clientReturning = (result, calls = []) => ({
  rpc: async (fn, args) => {
    calls.push({ fn, args });
    return result;
  },
});

test("returns the ids the database confirms, deduplicated in the request", async () => {
  const calls = [];
  const ids = await fetchVerifiedLandlordIds(clientReturning({ data: ["a"], error: null }, calls), ["a", "b", "a"]);
  assert.deepEqual([...ids], ["a"]);
  assert.deepEqual(calls[0].args.p_landlord_ids, ["a", "b"]);
});

test("makes no request for an empty list", async () => {
  const calls = [];
  const ids = await fetchVerifiedLandlordIds(clientReturning({ data: [], error: null }, calls), []);
  assert.equal(ids.size, 0);
  assert.equal(calls.length, 0);
});

test("shows no badge when the lookup fails", async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const ids = await fetchVerifiedLandlordIds(clientReturning({ data: null, error: { message: "boom" } }), ["a"]);
    assert.equal(ids.size, 0);
  } finally {
    console.error = original;
  }
});

import { fetchVerifiedLandlordDocumentTypes } from "./verified-landlord.ts";

test("lists the approved document types", async () => {
  const client = clientReturning({ data: ["Business Permit", "Tax Declaration"], error: null });
  assert.deepEqual(await fetchVerifiedLandlordDocumentTypes(client, "a"), ["Business Permit", "Tax Declaration"]);
});

test("lists no documents when the lookup fails", async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const client = clientReturning({ data: null, error: { message: "boom" } });
    assert.deepEqual(await fetchVerifiedLandlordDocumentTypes(client, "a"), []);
  } finally {
    console.error = original;
  }
});
