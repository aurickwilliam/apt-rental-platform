import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkDownloadLink,
  formatBytes,
  githubRepoFromUrl,
  parseCheckableUrl,
} from "./app-release-link.ts";

const APK = "https://github.com/o/r/releases/latest/download/apt.apk";

function responses(...steps) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const step = steps.shift();
    if (step instanceof Error) throw step;
    return new Response(null, step);
  };
  return { fetchImpl, calls };
}

test("only public https hosts are checkable", () => {
  assert.ok(parseCheckableUrl(APK));
  for (const bad of [
    "http://github.com/a.apk",
    "https://localhost/a.apk",
    "https://127.0.0.1/a.apk",
    "https://10.0.0.5/a.apk",
    "https://[::1]/a.apk",
    "https://router.local/a.apk",
    "https://user:pw@github.com/a.apk",
    "javascript:alert(1)",
    "not a url",
  ]) {
    assert.equal(parseCheckableUrl(bad), null, bad);
  }
});

test("follows redirects and reports the size of the file", async () => {
  const { fetchImpl, calls } = responses(
    { status: 302, headers: { location: "/o/r/releases/download/v1/apt.apk" } },
    { status: 302, headers: { location: "https://objects.githubusercontent.com/apt.apk" } },
    { status: 200, headers: { "content-length": "229010704" } },
  );
  assert.deepEqual(await checkDownloadLink(APK, fetchImpl), { state: "ok", bytes: 229010704 });
  assert.equal(calls.length, 3);
  assert.equal(calls[1], "https://github.com/o/r/releases/download/v1/apt.apk");
});

test("reports a missing file with its status", async () => {
  const { fetchImpl } = responses({ status: 404 });
  assert.deepEqual(await checkDownloadLink(APK, fetchImpl), { state: "missing", status: 404 });
});

test("never follows a redirect to an internal host", async () => {
  const { fetchImpl, calls } = responses({ status: 302, headers: { location: "https://169.254.169.254/latest" } });
  assert.deepEqual(await checkDownloadLink(APK, fetchImpl), { state: "unreachable" });
  assert.equal(calls.length, 1);
});

test("gives up on redirect loops, network errors and unsafe links", async () => {
  const loop = responses(...Array.from({ length: 10 }, () => ({ status: 302, headers: { location: APK } })));
  assert.deepEqual(await checkDownloadLink(APK, loop.fetchImpl), { state: "unreachable" });
  assert.equal(loop.calls.length, 6);

  const failing = responses(new Error("offline"));
  assert.deepEqual(await checkDownloadLink(APK, failing.fetchImpl), { state: "unreachable" });

  const never = responses();
  assert.deepEqual(await checkDownloadLink("http://github.com/a.apk", never.fetchImpl), { state: "unreachable" });
  assert.equal(never.calls.length, 0);
});

test("formats sizes and finds the GitHub repository", () => {
  assert.equal(formatBytes(229010704), "218 MB");
  assert.equal(formatBytes(2048), "2 KB");
  assert.equal(githubRepoFromUrl(APK), "o/r");
  assert.equal(githubRepoFromUrl("https://example.com/apt.apk"), null);
});
