import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";
import type { TenancyBill } from "@repo/utils";
import PaymentSummaryCard from "./PaymentSummaryCard";

jest.mock("heroui-native", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Passthrough = ({ children }: { children?: ReactNode }) => <View>{children}</View>;
  return { Card: Object.assign(Passthrough, { Header: Passthrough, Body: Passthrough, Footer: Passthrough }), Separator: () => null };
});

const fees = [{ id: "fee-1", title: "No water", amount: 200 }];

it("lists a legacy tenancy's pending fee and includes it in the total", async () => {
  await render(<PaymentSummaryCard month="December" year="2026" dueDate="2026-12-05" monthlyRent={80000} fees={fees} />);
  expect(screen.getByText("No water")).toBeTruthy();
  expect(screen.getByText("₱ 200")).toBeTruthy();
  expect(screen.getByText("₱ 80,200")).toBeTruthy();
});

it("shows only the rent when there are no pending fees", async () => {
  await render(<PaymentSummaryCard month="December" year="2026" dueDate="2026-12-05" monthlyRent={80000} />);
  expect(screen.queryByText("No water")).toBeNull();
  expect(screen.getAllByText("₱ 80,000").length).toBeGreaterThan(0);
});

it("leaves a server bill alone: its own fees and total win over the legacy list", async () => {
  const bill = { kind: "rent", rentDue: 80000, fees: [{ id: "bill-fee", title: "Repair", amount: 500 }], totalDue: 80500, securityDeposit: 0, advanceRent: 0 } as unknown as TenancyBill;
  await render(<PaymentSummaryCard month="December" year="2026" dueDate="2026-12-05" monthlyRent={80000} bill={bill} fees={fees} />);
  expect(screen.getByText("Repair")).toBeTruthy();
  expect(screen.queryByText("No water")).toBeNull();
  expect(screen.getByText("₱ 80,500")).toBeTruthy();
});
