import { fireEvent, render } from "@testing-library/react-native";
import { View } from "react-native";
import { MOBILE_COLORS } from "@/constants/theme";
import { findAllInTree } from "../../tests/support/testTraversal";
import BudgetProgressRow from "./BudgetProgressRow";

const mockUseColors = jest.fn();

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => mockUseColors(),
}));

jest.mock("heroui-native", () => {
  const { Pressable } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );
  const Button = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress: () => void;
  }) => <Pressable onPress={onPress}>{children}</Pressable>;
  return { Button };
});

describe("BudgetProgressRow", () => {
  beforeEach(() => {
    mockUseColors.mockReturnValue({
      colors: MOBILE_COLORS.dark,
      isDark: true,
    });
  });

  it("uses the softened dark danger token for an over-budget bar and label", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <BudgetProgressRow
        title="Furniture & appliances"
        caption="2 properties"
        amount={4700}
        spent={5875}
        action="View properties"
        onPress={onPress}
      />,
    );

    expect(screen.getByText("125% used").props.style).toEqual({
      color: MOBILE_COLORS.dark.danger,
    });

    const label = screen.getByText("₱ 1,175 over budget");
    expect(label.props.style).toEqual({ color: MOBILE_COLORS.dark.danger });

    const bar = findAllInTree(screen.root!, (n) => String(n.type) === "View")
      .find((view) => view.props.style?.width === "100%");
    expect(bar?.props.style).toEqual({
      width: "100%",
      backgroundColor: MOBILE_COLORS.dark.danger,
    });

    await fireEvent.press(label);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows the percentage of the monthly limit used beside the amount", async () => {
    const screen = await render(
      <BudgetProgressRow
        title="Concepcion Quiet 1BR"
        amount={1500}
        spent={1125}
        action="Edit budget"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("₱ 1,125 / ₱ 1,500")).toBeTruthy();
    expect(screen.getByText("75% used")).toBeTruthy();
    expect(screen.getByText("₱ 375 remaining")).toBeTruthy();
  });
});
