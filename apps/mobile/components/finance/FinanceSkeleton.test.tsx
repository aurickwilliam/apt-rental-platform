import type { PropsWithChildren } from "react";
import { render } from "@testing-library/react-native";
import FinanceSkeleton, {
  EntryFormFooterSkeleton,
  EntryFormSkeleton,
} from "./FinanceSkeleton";

jest.mock("heroui-native", () => {
  const { View } = jest.requireActual("react-native");
  function Group({ children, testID }: PropsWithChildren<{ testID?: string }>) {
    return <View testID={testID}>{children}</View>;
  }
  return { SkeletonGroup: Object.assign(Group, { Item: View }) };
});
jest.mock("./FinanceControls", () => {
  const { View } = jest.requireActual("react-native");
  return { FinanceCard: ({ children }: PropsWithChildren) => <View>{children}</View> };
});

describe("finance skeleton", () => {
  test("renders the entry form and footer placeholders accessibly", () => {
    const screen = render(
      <>
        <EntryFormSkeleton
          label="Loading expense form"
          testID="expense-entry-skeleton"
        />
        <EntryFormFooterSkeleton />
      </>,
    );
    expect(screen.getByLabelText("Loading expense form")).toBeTruthy();
    expect(screen.getByRole("progressbar").props.accessibilityState.busy).toBe(
      true,
    );
    expect(
      screen.getByTestId("expense-entry-skeleton", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(screen.queryByTestId("expense-entry-skeleton")).toBeNull();
  });
  test("the entry form skeleton carries the caller's label", () => {
    const screen = render(
      <EntryFormSkeleton
        label="Loading budget form"
        testID="budget-entry-skeleton"
      />,
    );
    expect(screen.getByLabelText("Loading budget form")).toBeTruthy();
    expect(
      screen.getByTestId("budget-entry-skeleton", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });

  test.each(["overview", "expenses", "budget"] as const)("renders the %s layout with an accessible loading state", (tab) => {
    const screen = render(<FinanceSkeleton tab={tab} />);
    expect(screen.getByLabelText("Loading profit and planning")).toBeTruthy();
    expect(screen.getByRole("progressbar").props.accessibilityState.busy).toBe(true);
    // Decorative placeholders are hidden from assistive technology.
    expect(screen.getByTestId(`finance-skeleton-${tab}`, { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId(`finance-skeleton-${tab}`)).toBeNull();
  });
});
