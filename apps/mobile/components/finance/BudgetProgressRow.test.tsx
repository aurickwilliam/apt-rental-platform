import { fireEvent, render } from "@testing-library/react-native";
import { View } from "react-native";
import { MOBILE_COLORS } from "@/constants/theme";
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

  it("uses the softened dark danger token for an over-budget bar and label", () => {
    const onPress = jest.fn();
    const screen = render(
      <BudgetProgressRow
        title="Furniture & appliances"
        caption="2 properties"
        amount={4700}
        spent={5875}
        action="View properties"
        onPress={onPress}
      />,
    );

    const label = screen.getByText("₱ 1,175 over budget · 125% used");
    expect(label.props.style).toEqual({ color: MOBILE_COLORS.dark.danger });

    const bar = screen
      .UNSAFE_getAllByType(View)
      .find((view) => view.props.style?.width === "100%");
    expect(bar?.props.style).toEqual({
      width: "100%",
      backgroundColor: MOBILE_COLORS.dark.danger,
    });

    fireEvent.press(label);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
