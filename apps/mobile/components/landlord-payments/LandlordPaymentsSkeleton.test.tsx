import { render, screen } from "@testing-library/react-native";

import LandlordPaymentsSkeleton from "./LandlordPaymentsSkeleton";

const mockGroup: { props?: Record<string, unknown>; items: string[] } = { items: [] };
jest.mock("heroui-native", () => {
  const { View } = jest.requireActual("react-native");
  const SkeletonGroup = Object.assign(
    ({ children, ...props }: { children?: React.ReactNode }) => { mockGroup.props = props; mockGroup.items = []; return <View>{children}</View>; },
    { Item: ({ className }: { className?: string }) => { mockGroup.items.push(className ?? ""); return <View /> } },
  );
  return { SkeletonGroup };
});

describe("LandlordPaymentsSkeleton", () => {
  it("loads as one HeroUI skeleton group with an accessible name", () => {
    render(<LandlordPaymentsSkeleton />);
    expect(mockGroup.props).toMatchObject({ isLoading: true, accessibilityLabel: "Loading payments" });
  });

  it("mirrors the loaded screen: picker, four tiles, status row with a round filter button, four cards", () => {
    render(<LandlordPaymentsSkeleton />);
    const items = mockGroup.items;
    expect(items.filter((className) => className.includes("h-24 rounded-3xl"))).toHaveLength(4);
    expect(items.filter((className) => className.includes("h-28 w-full rounded-3xl"))).toHaveLength(4);
    expect(items.filter((className) => className.includes("size-12 rounded-full"))).toHaveLength(1);
    expect(items.filter((className) => className.includes("h-12") && className.includes("rounded-2xl"))).toHaveLength(2);
    expect(screen.toJSON()).not.toBeNull();
  });
});
