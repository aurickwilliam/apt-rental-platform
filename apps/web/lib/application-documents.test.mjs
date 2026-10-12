import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApplicationDocumentList } from "./application-documents.ts";

test("lists every slot, with the right wording for empty ones", () => {
  const list = buildApplicationDocumentList(
    { gov_id_url: "u/v/id-front.jpg", proof_of_billing_url: "u/passport/bill.pdf" },
    { "u/v/id-front.jpg": "https://signed/front", "u/passport/bill.pdf": "https://signed/bill" },
  );

  assert.deepEqual(
    list.map(({ label, path, emptyLabel }) => [label, path, emptyLabel]),
    [
      ["Government ID", "u/v/id-front.jpg", "Not provided"],
      ["Proof of Income", null, "Not provided"],
      ["Proof of Billing", "u/passport/bill.pdf", "Not provided"],
      ["NBI Clearance", null, "Not provided (optional)"],
    ],
  );
  assert.equal(list[0].signedUrl, "https://signed/front");
  assert.equal(list[1].signedUrl, null);
});

test("includes the ID back only when the application has one", () => {
  const list = buildApplicationDocumentList({ gov_id_url: "a", gov_id_back_url: "b" }, {});
  assert.deepEqual(
    list.map((entry) => entry.label),
    ["Government ID", "Government ID (Back)", "Proof of Income", "Proof of Billing", "NBI Clearance"],
  );
});
