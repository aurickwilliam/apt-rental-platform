import { fireEvent, render, screen } from "@testing-library/react-native";

import SearchHeader from "./SearchHeader";

jest.mock("heroui-native", () => {
  const { Pressable } = jest.requireActual("react-native");
  return { Button: ({ children, onPress, accessibilityLabel }: { children: unknown; onPress?: () => void; accessibilityLabel?: string }) => (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel}>{children as never}</Pressable>
  ) };
});
jest.mock("@tabler/icons-react-native", () => ({
  IconHeart: () => null,
  IconLayoutGrid: () => null,
  IconLayoutRows: () => null,
  IconMap: () => null,
}));
jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#888" } }) }));

const props = {
  isGridView: true,
  onToggleView: jest.fn(),
  onFavoritesPress: jest.fn(),
  onMapPress: jest.fn(),
  onAskAvaPress: jest.fn(),
};

describe("SearchHeader", () => {
  it("shows the title as a header, without the old location dropdown", () => {
    render(<SearchHeader {...props} />);
    expect(screen.getByRole("header")).toHaveTextContent("Find your next home");
    expect(screen.queryByText("Select Location")).toBeNull();
  });

  it("opens Ava, Favorites and the map from the title row, Ava first", () => {
    render(<SearchHeader {...props} />);
    fireEvent.press(screen.getByLabelText("Ask Ava, the APT Virtual Assistant"));
    fireEvent.press(screen.getByLabelText("Favorites"));
    fireEvent.press(screen.getByLabelText("Map search"));
    expect(props.onAskAvaPress).toHaveBeenCalledTimes(1);
    expect(props.onFavoritesPress).toHaveBeenCalledTimes(1);
    expect(props.onMapPress).toHaveBeenCalledTimes(1);
    const order = JSON.stringify(screen.toJSON());
    expect(order.indexOf("Ask Ava")).toBeLessThan(order.indexOf("Favorites"));
  });

  it("omits Ava when there is no entry for it", () => {
    render(<SearchHeader {...props} onAskAvaPress={undefined} />);
    expect(screen.queryByLabelText("Ask Ava, the APT Virtual Assistant")).toBeNull();
  });

  it("offers the view toggle only outside discovery", () => {
    const { rerender } = render(<SearchHeader {...props} isNetflixMode />);
    expect(screen.queryByLabelText("Toggle view")).toBeNull();
    rerender(<SearchHeader {...props} />);
    fireEvent.press(screen.getByLabelText("Toggle view"));
    expect(props.onToggleView).toHaveBeenCalledTimes(1);
  });
});
