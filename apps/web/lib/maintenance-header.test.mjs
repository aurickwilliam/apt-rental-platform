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
  assert.match(maintenance, /Request Maintenance\s*<\/h1>/);
  assert.match(maintenance, /Let your landlord know about an issue with your unit\./);
});
