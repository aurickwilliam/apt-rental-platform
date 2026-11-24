import { fireEvent, render } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import EarningsSummaryCard from "./EarningsSummaryCard";
import { SCROLLABLE_BODY_MAX_HEIGHT } from "@/components/display/AppDialog";
import { findAllInTree } from "../../tests/support/testTraversal";
import type { FinanceData } from "@/service/finance/financeService";

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("./MoneyRow", () => {
  const { Text, View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ label, amount }: { label: string; amount: number | null }) => (
      <View>
        <Text>{label}</Text>
        <Text>{amount === null ? "Not calculated" : String(amount)}</Text>
      </View>
    ),
  };
});

const data: FinanceData = {
  properties: [{ id: "villa", name: "Villa" }],
  months: [
    { month: "2026-10", collected: 28000, operating: 20550, capital: 12500, reviewed: true },
  ],
  comparison: { collected: 26000, operating: 19000, reviewed: true },
  categories: [],
  budgets: [
    {
      id: "budget-1",
      apartment_id: "villa",
      month: "2026-10",
      category: "maintenance",
      kind: "reserve",
      amount: 15000,
      target_amount: null,
      months_remaining: null,
      spent: 0,
    },
  ],
  performance: [],
  collections: {
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    overdueCount: 0,
    age7: 0,
    age30: 0,
    ageOlder: 0,
  },
  unclassified: 0,
};

const card = (overrides: Partial<FinanceData> = {}) => (
  <EarningsSummaryCard data={{ ...data, ...overrides }} month="2026-10" onReview={jest.fn()} />
);

describe("earnings summary card", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("the breakdown keeps figures only and moves the guidelines into a dialog", async () => {
    const screen = await render(card());
    expect(screen.queryByText("How these figures are calculated")).toBeNull();

    await fireEvent.press(screen.getByText("View breakdown & calculation"));
    const link = screen.getByText("How these figures are calculated");
    expect(screen.queryByText(/Only confirmed rent payments/)).toBeNull();

    await fireEvent.press(link);
    expect(screen.getByText("Profit & planning guidelines")).toBeTruthy();
    expect(screen.getByText(/Only confirmed rent payments linked to a tenancy/)).toBeTruthy();
    expect(screen.getByText(/Net operating income is cash-based/)).toBeTruthy();
    expect(screen.getByText(/Planned reserves are amounts you intend to set aside/)).toBeTruthy();
    expect(screen.getByText(/including zero-spending months/)).toBeTruthy();
    expect(screen.getByText(/through 2026-10-17/)).toBeTruthy();
    const body = findAllInTree(screen.root!, (n) => String(n.type) === "RCTScrollView")[0];
    expect(body.props.style).toEqual({ maxHeight: SCROLLABLE_BODY_MAX_HEIGHT });
  });

  test("the dialog closes from its action and the link stays available", async () => {
    const screen = await render(card());
    await fireEvent.press(screen.getByText("View breakdown & calculation"));
    await fireEvent.press(screen.getByText("How these figures are calculated"));
    await fireEvent.press(screen.getByText("Got it"));

    expect(screen.getAllByText("How these figures are calculated")).toHaveLength(1);
    expect(screen.queryByText(/Only confirmed rent payments/)).toBeNull();
  });
});
