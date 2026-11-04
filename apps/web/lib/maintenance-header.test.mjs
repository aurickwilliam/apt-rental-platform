import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Maintenance matches the Passport title, icon tile and description placement", () => {
  const maintenance = readFileSync(new URL("../app/tenant/maintenance/MaintenanceClient.tsx", import.meta.url), "utf8");
  const passport = readFileSync(new URL("../app/components/passport/PassportPageLayout.tsx", import.meta.url), "utf8");
  const titleClass = source => source.match(/<h1 className="([^"]+)"/)[1];
  const iconTileClass = source => source.match(/<h1[^>]*>\s*<span className="([^"]+)"/)[1];
  const descriptionClass = source => source.match(/<\/h1>\s*<p className="([^"]+)"/)[1];

  assert.equal(titleClass(maintenance), titleClass(passport));
  assert.equal(iconTileClass(maintenance), iconTileClass(passport));
  assert.equal(descriptionClass(maintenance), descriptionClass(passport));
  assert.match(maintenance, /<Wrench size=\{28\} aria-hidden="true"/);
  assert.match(maintenance, /Maintenance\s*<\/h1>/);
  assert.match(maintenance, /Request Maintenance\s*<\/Button>/);
  assert.match(maintenance, /<Button variant="primary" className="ml-auto self-end"/);
  assert.match(maintenance, /Let your landlord know about an issue with your unit\./);
});

test("Maintenance cards and loading placeholders stretch to equal height only in the desktop columns", () => {
  const maintenance = readFileSync(new URL("../app/tenant/maintenance/MaintenanceClient.tsx", import.meta.url), "utf8");
  const skeleton = readFileSync(new URL("../app/tenant/maintenance/components/MaintenancePageSkeleton.tsx", import.meta.url), "utf8");
  for (const source of [maintenance, skeleton]) {
    assert.match(source, /grid items-start gap-4 lg:grid-cols-3 lg:items-stretch/);
    assert.match(source, /min-w-0 lg:col-span-2 lg:grid/);
  }
  assert.match(maintenance, /<aside className="min-w-0 lg:grid"/);
});
