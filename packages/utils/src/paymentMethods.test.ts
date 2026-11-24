import { DATABASE_METHODS, PAYMENT_METHOD_TYPES, isPaymentMethod, paymentMethodLabel } from "./paymentMethods";

it("offers the six checkout methods in a fixed order", () => {
  expect([...PAYMENT_METHOD_TYPES]).toEqual(["GCash", "Maya", "QRPh", "Bank Transfer", "Debit/Credit-Card", "Cash"]);
});

it("maps every method to a distinct database name", () => {
  const names = PAYMENT_METHOD_TYPES.map((method) => DATABASE_METHODS[method]);
  expect(names).toEqual(["gcash", "maya", "qrph", "bank_transfer", "card", "cash"]);
  expect(new Set(names).size).toBe(names.length);
});

it("recognises only known method names and labels the card readably", () => {
  expect(isPaymentMethod("Maya")).toBe(true);
  expect(isPaymentMethod("maya")).toBe(false);
  expect(isPaymentMethod("PayPal")).toBe(false);
  expect(paymentMethodLabel("Debit/Credit-Card")).toBe("Debit/Credit Card");
  expect(paymentMethodLabel("Bank Transfer")).toBe("Bank Transfer");
  expect(paymentMethodLabel("Cash", "fil")).toBe("Cash");
});
