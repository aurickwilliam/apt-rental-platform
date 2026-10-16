import { render, screen } from "@testing-library/react-native";

import MoveInCostBreakdown from "./MoveInCostBreakdown";

jest.mock("heroui-native", () => ({ Separator: () => null }));

it.each([
  [45000, 90000, "Security Deposit (2 months)"],
  [45000, 45000, "Security Deposit (1 month)"],
  ["45000", "90000", "Security Deposit (2 months)"],
  [45000, 0, "Security Deposit"],
  [45000, null, "Security Deposit"],
  [45000, 50000, "Security Deposit"],
  [0, 90000, "Security Deposit"],
] as const)("labels a %s rent and %s deposit as %s", (monthlyRent, securityDeposit, label) => {
  render(
    <MoveInCostBreakdown
      monthlyRent={monthlyRent}
      securityDeposit={securityDeposit}
      advanceRent={45000}
    />,
  );

  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByText("Monthly Rent")).toBeTruthy();
  expect(screen.getByText("Advance Rent")).toBeTruthy();
});
