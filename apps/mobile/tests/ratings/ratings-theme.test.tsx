import type { ReactNode } from "react";
import type { PressableProps, TextProps, ViewProps } from "react-native";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";
import { useUniwind } from "uniwind";
import { MOBILE_COLORS } from "@/constants/theme";
import RatingsPage from "@/app/apartment/[apartmentId]/ratings";

let mockOverallRating = 0;
let mockTotalReviews = 0;
const mockUseUniwind = useUniwind as jest.Mock;

jest.mock("expo-router", () => ({ useLocalSearchParams: () => ({ apartmentId: "current-apartment" }), useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock("hooks/ratings", () => ({
  useApartmentReviews: () => ({
    loading: false, error: null, overallRating: mockOverallRating, totalReviews: mockTotalReviews,
    ratingsCount: [5, 4, 3, 2, 1].map(rating => ({ rating, ratingCount: rating === 5 ? mockTotalReviews : 0, totalCount: mockTotalReviews })),
    reviews: [], sortBy: "Most Recent", setSortBy: jest.fn(), canReview: false, checkingEligibility: false, reviewableTenancyId: null,
  }),
}));
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Screen({ children }: { children: ReactNode }) { return <View>{children}</View>; } };
});
jest.mock("components/layout/StandardHeader", () => ({ __esModule: true, default: () => null }));
jest.mock("components/buttons/DropdownButton", () => ({ __esModule: true, default: () => null }));
jest.mock("components/cards/RatingCard", () => ({ __esModule: true, default: () => null }));
jest.mock("@tabler/icons-react-native", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  function Star({ color }: { color: string }) { return <View testID="rating-star" style={{ backgroundColor: color }} />; }
  return { IconStar: Star, IconStarFilled: Star, IconStarHalfFilled: Star };
});
jest.mock("heroui-native", () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  const Slider = ({ value, minValue, maxValue, children }: { value: number; minValue: number; maxValue: number; children: ReactNode }) =>
    <View testID="rating-meter" accessibilityValue={{ now: value, min: minValue, max: maxValue }}>{children}</View>;
  Slider.Track = function Track(props: ViewProps) { return <View {...props} testID="rating-track" />; };
  Slider.Fill = function Fill(props: ViewProps) { return <View {...props} testID="rating-fill" />; };
  const Button = (props: PressableProps) => <Pressable {...props} />;
  Button.Label = function Label(props: TextProps) { return <Text {...props} />; };
  return { Slider, Button, Spinner: View };
});

beforeEach(() => { mockOverallRating = 0; mockTotalReviews = 0; mockUseUniwind.mockReturnValue({ theme: "light", hasAdaptiveThemes: true }); });

describe.each(["light", "dark"] as const)("ratings summary in %s mode", theme => {
  it.each([0, 4.5])("uses matching yellow score/stars/fills and a theme-aware track for score %s", score => {
    mockUseUniwind.mockReturnValue({ theme, hasAdaptiveThemes: true });
    mockOverallRating = score;
    mockTotalReviews = score ? 10 : 0;
    const colors = MOBILE_COLORS[theme];
    const screen = render(<RatingsPage />);
    expect(StyleSheet.flatten(screen.getByText(score.toFixed(1)).props.style).color).toBe(colors.rating);
    for (const star of screen.getAllByTestId("rating-star")) {
      expect(StyleSheet.flatten(star.props.style).backgroundColor).toBe(colors.rating);
    }
    const tracks = screen.getAllByTestId("rating-track");
    expect(tracks).toHaveLength(5);
    for (const track of tracks) {
      expect(StyleSheet.flatten(track.props.style).backgroundColor).toBe(colors.surfaceTertiary);
      expect(track.props.className).not.toContain("bg-gray-100");
    }
    for (const fill of screen.getAllByTestId("rating-fill")) {
      expect(StyleSheet.flatten(fill.props.style).backgroundColor).toBe(colors.rating);
    }
    expect(screen.getAllByTestId("rating-meter").map(meter => meter.props.accessibilityValue.now)).toEqual(score ? [100, 0, 0, 0, 0] : [0, 0, 0, 0, 0]);
  });
});

it("updates meter surfaces when the resolved theme changes without changing the score", () => {
  mockOverallRating = 4.5;
  const screen = render(<RatingsPage />);
  expect(StyleSheet.flatten(screen.getAllByTestId("rating-track")[0].props.style).backgroundColor).toBe(MOBILE_COLORS.light.surfaceTertiary);
  mockUseUniwind.mockReturnValue({ theme: "dark", hasAdaptiveThemes: true });
  screen.rerender(<RatingsPage />);
  expect(StyleSheet.flatten(screen.getAllByTestId("rating-track")[0].props.style).backgroundColor).toBe(MOBILE_COLORS.dark.surfaceTertiary);
  expect(StyleSheet.flatten(screen.getByText("4.5").props.style).color).toBe(MOBILE_COLORS.dark.rating);
});
