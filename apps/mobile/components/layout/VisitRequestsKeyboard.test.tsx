import { fireEvent, render } from "@testing-library/react-native";
import { FlatList } from "react-native";

import VisitRequests from "@/app/landlord/visit-requests";
import { renderKeyboardAwareListScrollView } from "./ScreenWrapper";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock("@/hooks/visitRequests", () => ({
  useLandlordVisitRequests: () => ({
    visitRequests: [],
    refetch: jest.fn(),
    loading: false,
  }),
}));

jest.mock("@/hooks/apartments", () => ({
  useLandlordActionBadges: () => ({ markViewed: jest.fn() }),
}));

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { gray500: "#626B73" } }),
}));

jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View, ScrollView } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: View,
    renderKeyboardAwareListScrollView: jest.fn((props) => <ScrollView {...props} />),
  };
});

jest.mock("@/components/layout/StandardHeader", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/display/PullToRefresh", () => {
  const { RefreshControl } = jest.requireActual("react-native");
  return {
    PullToRefreshControl: RefreshControl,
    PullToRefreshIndicator: () => null,
  };
});

jest.mock("@/app/landlord/visit-requests/components/VisitRequestCalendar", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/app/landlord/visit-requests/components/VisitRequestCard", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/app/landlord/visit-requests/components/VisitRequestCardSkeleton", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("heroui-native", () => {
  const { View, TextInput } = jest.requireActual("react-native");
  return {
    Card: Object.assign(View, { Body: View }),
    SearchField: Object.assign(View, {
      Group: View,
      SearchIcon: () => null,
      Input: TextInput,
      ClearButton: () => null,
    }),
  };
});

it("scrolls the measured search section upward on focus, including with no approved visits", () => {
  const scrollToOffset = jest.spyOn(FlatList.prototype, "scrollToOffset")
    .mockImplementation(() => {});
  try {
    const { getByText, getByPlaceholderText, UNSAFE_getByType } = render(<VisitRequests />);
    const searchSection = getByText("Approved Visit Requests").parent?.parent;

    expect(UNSAFE_getByType(FlatList).props.renderScrollComponent)
      .toBe(renderKeyboardAwareListScrollView);
    expect(getByText("No approved visits")).toBeTruthy();

    fireEvent(searchSection!, "layout", {
      nativeEvent: { layout: { x: 0, y: 420, width: 320, height: 100 } },
    });
    fireEvent(getByPlaceholderText("Search tenant or apartment..."), "focus");
    expect(scrollToOffset).toHaveBeenLastCalledWith({ offset: 420, animated: true });

    // A calendar/layout size change must not leave a hard-coded scroll target.
    fireEvent(searchSection!, "layout", {
      nativeEvent: { layout: { x: 0, y: 500, width: 320, height: 100 } },
    });
    fireEvent(getByPlaceholderText("Search tenant or apartment..."), "focus");
    expect(scrollToOffset).toHaveBeenLastCalledWith({ offset: 500, animated: true });

    fireEvent(getByPlaceholderText("Search tenant or apartment..."), "blur");
    expect(scrollToOffset).toHaveBeenCalledTimes(2);
  } finally {
    scrollToOffset.mockRestore();
  }
});
