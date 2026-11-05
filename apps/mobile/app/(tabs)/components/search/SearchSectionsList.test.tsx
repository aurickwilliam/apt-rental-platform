import { FlatList } from "react-native";
import { render } from "@testing-library/react-native";

import SearchSectionsList from "./SearchSectionsList";

jest.mock('@/components/layout/TabBarVisibilityContext', () => ({
  useTabScreenScroll: () => ({ ref: { current: null }, onScroll: jest.fn() }),
}));

jest.mock("./SearchSection", () => ({
  __esModule: true,
  default: () => null,
  SearchSectionSkeleton: () => null,
}));
jest.mock("heroui-native", () => ({ Button: () => null }));
jest.mock("@tabler/icons-react-native", () => ({ IconAlertCircle: () => null, IconSearchOff: () => null }));
jest.mock("components/display/EmptyState", () => () => null);
jest.mock("components/display/PullToRefresh", () => ({
  PullToRefreshControl: () => null,
  PullToRefreshIndicator: () => null,
}));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#000" } }) }));
jest.mock("@/components/layout/CustomTabBar", () => ({
  FLOATING_TAB_BAR_HEIGHT: 60,
  FLOATING_TAB_BAR_BOTTOM_OFFSET: 10,
}));

const sections = [{ id: "verified", title: "Verified", apartments: [{ id: "a" } as never] }];

const renderList = (isFetching: boolean) =>
  render(
    <SearchSectionsList
      sections={sections}
      isLoading={false}
      isFetching={isFetching}
      error={null}
      onRefresh={jest.fn()}
      isFavorite={() => false}
      onToggleFavorite={jest.fn()}
      onPressApartment={jest.fn()}
    />,
  );

describe("SearchSectionsList", () => {
  it("renders no list header at rest, so the list's gap never opens space above the first section", () => {
    const { UNSAFE_getByType } = renderList(false);
    expect(UNSAFE_getByType(FlatList).props.ListHeaderComponent).toBeNull();
  });

  it("shows the refresh indicator as the header while refreshing", () => {
    const { UNSAFE_getByType } = renderList(true);
    expect(UNSAFE_getByType(FlatList).props.ListHeaderComponent).not.toBeNull();
  });
});
