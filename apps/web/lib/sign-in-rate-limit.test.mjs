import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIpFromHeaders } from "./sign-in-rate-limit.ts";

test("uses the first forwarded hop", () => {
  assert.equal(
    clientIpFromHeaders({ "x-forwarded-for": "203.0.113.5, 10.0.0.1", "x-real-ip": "10.0.0.2" }),
    "203.0.113.5",
  );
});

test("falls back to x-real-ip, then to empty", () => {
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": null, "x-real-ip": "198.51.100.7" }), "198.51.100.7");
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": null, "x-real-ip": null }), "");
});

test("rejects garbage values", () => {
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": "<script>", "x-real-ip": undefined }), "");
});
