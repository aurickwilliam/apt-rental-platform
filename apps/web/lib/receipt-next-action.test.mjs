import assert from "node:assert/strict";
import test from "node:test";
import { receiptNextAction } from "./receipt-next-action.ts";

const payment = change => ({ status: "pending", method: "gcash", reference_id: "APT-ABCD1234", ...change });

test("a pending online payment is checked again on the verify page", () => {
  assert.deepEqual({ ...receiptNextAction(payment()) }, {
    label: "Check payment status",
    href: "/tenant/payment/verify?sessionId=APT-ABCD1234",
  });
  assert.equal(receiptNextAction(payment({ status: "Pending", reference_id: "a b/c" })).href, "/tenant/payment/verify?sessionId=a%20b%2Fc", "the reference is encoded");
});

test("a failed attempt or a declined cash request goes back to checkout", () => {
  for (const status of ["failed", "Failed", "rejected"]) {
    assert.deepEqual({ ...receiptNextAction(payment({ status })) }, { label: "Try again", href: "/tenant/payment" });
  }
});

test("cash waiting for the landlord, finished payments and unknown rows have no next step", () => {
  assert.equal(receiptNextAction(payment({ method: "cash" })), null);
  assert.equal(receiptNextAction(payment({ status: "paid" })), null);
  assert.equal(receiptNextAction(payment({ status: null })), null);
  assert.equal(receiptNextAction(payment({ reference_id: null })), null, "no reference, nothing to check");
});
