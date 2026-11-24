import { render, screen } from "@testing-library/react-native";
import { formatPesoDisplay } from "@repo/utils";
import MaintenanceFeeCard from "./MaintenanceFeeCard";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ isDark: false }) }));

it.each([
  { status: "pending" as const, label: "Added to next rent" },
  { status: "paid" as const, label: "Paid" },
  { status: "waived" as const, label: "Waived" },
])("shows the amount and $status fee state", async ({ status, label }) => {
  await render(<MaintenanceFeeCard amount={1250} status={status} />);
  expect(screen.getByText("Maintenance Fee")).toBeTruthy();
  expect(screen.getByText(formatPesoDisplay(1250))).toBeTruthy();
  expect(screen.getByText(label)).toBeTruthy();
});

it.each([null, 0])("hides absent or zero fee %s", async (amount) => {
  await render(<MaintenanceFeeCard amount={amount} status={null} />);
  expect(screen.queryByText("Maintenance Fee")).toBeNull();
});
