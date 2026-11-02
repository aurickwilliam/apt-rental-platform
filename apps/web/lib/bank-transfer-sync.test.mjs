import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

// The shared bank list (web and mobile read it) and the copy the `paymongo` edge function keeps,
// because an edge function cannot import workspace packages.
const shared = read("../../../packages/constants/src/bankTransfer.ts");
const edge = read("../../../supabase/functions/paymongo/index.ts");

const sharedBanks = [...shared.matchAll(/code:\s*'([a-z]+)',\s*name:\s*'([^']+)',\s*maxAmount:\s*([\d_]+)/g)]
  .map((match) => ({ code: match[1], name: match[2], maxAmount: Number(match[3].replaceAll("_", "")) }));
const edgeBlock = edge.match(/const BANK_TRANSFER_LIMITS[^{]*\{([\s\S]*?)\n\}/);
const edgeBanks = edgeBlock
  ? [...edgeBlock[1].matchAll(/([a-z]+):\s*\{\s*name:\s*'([^']+)',\s*maxAmount:\s*(\d+)/g)]
      .map((match) => ({ code: match[1], name: match[2], maxAmount: Number(match[3]) }))
  : [];

// Every offered bank has its own checkout type on the edge function.
const checkoutBlock = edge.match(/const BANK_TRANSFER_CHECKOUT_TYPES[^{]*\{([\s\S]*?)\n\}/);
const checkoutBankCodes = checkoutBlock ? [...checkoutBlock[1].matchAll(/([a-z]+):\s*'[a-z_]+'/g)].map((match) => match[1]) : [];

// Method names the database accepts in the migration, the shared list and the edge function.
const migration = read("../../../supabase/migrations/20261102120000_bank_transfer_and_accepted_payment_methods.sql");
const methodsCheck = migration.match(/payment_method_check\s+check \(method in \(([^)]*)\)\)/);

test("both bank lists were found", () => {
  assert.ok(sharedBanks.length > 0, "could not read BANK_TRANSFER_BANKS");
  assert.ok(edgeBanks.length > 0, "could not read BANK_TRANSFER_LIMITS");
});

test("the edge function offers the same banks and limits as the shared list", () => {
  assert.deepEqual(edgeBanks, sharedBanks);
});

test("the edge function has a checkout type for every bank in the shared list", () => {
  assert.deepEqual(checkoutBankCodes, sharedBanks.map((bank) => bank.code));
});

test("the database accepts bank_transfer as a payment method", () => {
  assert.ok(methodsCheck, "could not read payment_method_check");
  assert.ok(methodsCheck[1].includes("'bank_transfer'"));
});
