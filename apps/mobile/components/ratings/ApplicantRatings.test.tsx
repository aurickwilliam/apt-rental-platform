import type { PressableProps, TextProps } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import ApplicantRatings from "./ApplicantRatings";

const mockPush = jest.fn();
const mockRefetch = jest.fn();
let mockState: {
  reviews: unknown[];
  average: number;
  count: number;
  loading: boolean;
  isError: boolean;
  refetch: () => void;
};

jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("@/hooks/ratings", () => ({ useTenantReviews: () => mockState }));
jest.mock("@tabler/icons-react-native", () => ({ IconChevronRight: () => null, IconStar: () => null }));
jest.mock("@/components/display/EmptyState", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return function EmptyState({ title, description }: { title: string; description?: string }) {
    return <Text>{`${title}|${description}`}</Text>;
  };
});
jest.mock("@/components/display/StarRating", () => () => null);
jest.mock("@/components/cards/RatingCard", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return function RatingCard({ name, review }: { name: string; review: string }) {
    return <Text>{`${name}: ${review}`}</Text>;
  };
});
jest.mock("heroui-native", () => {
  const { Text, Pressable, View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Button = (props: PressableProps) => <Pressable accessibilityRole="button" {...props} />;
  Button.Label = function Label(props: TextProps) { return <Text {...props} />; };
  return { Button, Spinner: () => <View testID="spinner" /> };
});

const review = (id: string) => ({
  id,
  landlordName: `Landlord ${id}`,
  createdAt: "2026-10-01T00:00:00Z",
  rating: 4,
  comment: `Comment ${id}`,
  landlordAvatarUrl: null,
  apartmentName: "Unit 5",
  leaseStart: "2026-01-01",
  leaseEnd: "2026-06-01",
  isMine: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockState = { reviews: [], average: 0, count: 0, loading: false, isError: false, refetch: mockRefetch };
});

describe("ApplicantRatings", () => {
  it("shows a spinner while loading", () => {
    mockState.loading = true;
    render(<ApplicantRatings tenantId="t1" tenantName="Ana Cruz" />);
    expect(screen.getByTestId("spinner")).toBeTruthy();
  });

  it("shows 'No ratings yet' when the tenant has none", () => {
    render(<ApplicantRatings tenantId="t1" tenantName="Ana Cruz" />);
    expect(screen.getByText(/^No ratings yet\|/)).toBeTruthy();
  });

  it("degrades to an inline retry when the ratings fail to load", () => {
    mockState.isError = true;
    render(<ApplicantRatings tenantId="t1" tenantName="Ana Cruz" />);
    expect(screen.getByText(/You can still review and decide/)).toBeTruthy();
    fireEvent.press(screen.getByText("Try Again"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows the summary, the five newest ratings and a link to the full profile", () => {
    mockState = {
      ...mockState,
      reviews: ["a", "b", "c", "d", "e", "f"].map(review),
      average: 4,
      count: 6,
    };
    render(<ApplicantRatings tenantId="t1" tenantName="Ana Cruz" />);
    expect(screen.getByText("4.0")).toBeTruthy();
    expect(screen.getByText("4.0 from 6 landlord ratings")).toBeTruthy();
    expect(screen.getByText("Landlord a: Comment a")).toBeTruthy();
    expect(screen.queryByText("Landlord f: Comment f")).toBeNull();
    expect(screen.getByText("Showing the 5 most recent of 6 ratings.")).toBeTruthy();
    fireEvent.press(screen.getByText("View full profile"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/profile/tenant/[tenantId]", params: { tenantId: "t1" } });
  });
});
