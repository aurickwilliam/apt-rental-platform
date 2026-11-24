import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import SearchFiltersBar from "./SearchFiltersBar";

jest.mock("heroui-native", () => {
  const { View, Text, TextInput } = jest.requireActual("react-native");
  const SearchField = Object.assign(({ children }: { children: unknown }) => <View>{children as never}</View>, {
    Group: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    Input: (props: object) => <TextInput {...props} />,
    ClearButton: () => null,
  });
  const Chip = Object.assign(({ children }: { children: unknown }) => <View>{children as never}</View>, {
    Label: ({ children }: { children: unknown }) => <Text>{children as never}</Text>,
  });
  return { SearchField, Chip };
});
jest.mock("@tabler/icons-react-native", () => ({
  IconFilter2: () => null,
  IconSearch: () => null,
  IconX: () => null,
}));
jest.mock("hooks/useTheme", () => ({
  useColors: () => ({ colors: { gray500: "#888", primary: "#376BF5" } }),
}));

const baseProps = {
  searchValue: "",
  onChangeSearch: jest.fn(),
  onSubmitSearch: jest.fn(),
  onClearSearch: jest.fn(),
  onFilterPress: jest.fn(),
  activeFilterCount: 0,
  loading: false,
  onClearFilters: jest.fn(),
};

describe("SearchFiltersBar", () => {
  it("has no row under the field in the default view, so nothing pushes the first section down", async () => {
    await render(<SearchFiltersBar {...baseProps} />);
    expect(screen.queryByTestId("search-meta-row")).toBeNull();
  });

  it("shows the result count once a search or filter has one", async () => {
    await render(<SearchFiltersBar {...baseProps} resultCount={3} />);
    expect(screen.getByTestId("search-meta-row")).toBeTruthy();
    expect(screen.getByText("3 apartments found")).toBeTruthy();
  });

  it("uses the singular for one result and hides the count while loading", async () => {
    const { rerender } = await render(<SearchFiltersBar {...baseProps} resultCount={1} />);
    expect(screen.getByText("1 apartment found")).toBeTruthy();
    await rerender(<SearchFiltersBar {...baseProps} resultCount={1} loading />);
    expect(screen.queryByText("1 apartment found")).toBeNull();
    expect(screen.queryByTestId("search-meta-row")).toBeNull();
  });

  it("offers Clear filters while filters are active", async () => {
    await render(<SearchFiltersBar {...baseProps} activeFilterCount={2} />);
    expect(screen.getByText("Clear filters")).toBeTruthy();
  });

  it("keeps Filters inside the bar, with a count badge", async () => {
    const onFilterPress = jest.fn();
    await render(<SearchFiltersBar {...baseProps} onFilterPress={onFilterPress} activeFilterCount={12} />);
    await fireEvent.press(screen.getByLabelText("Filters"));
    expect(onFilterPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("9+")).toBeTruthy();
  });

  it("holds no Ava entry, and no search button at the end of the bar", async () => {
    await render(<SearchFiltersBar {...baseProps} />);
    expect(screen.queryByLabelText("Ask Ava, the APT Virtual Assistant")).toBeNull();
    // The magnifier at the left is the only search control besides the keyboard.
    expect(screen.getAllByLabelText("Search")).toHaveLength(1);
  });

  it("renders the city chips under the field, above the count row", async () => {
    await render(<SearchFiltersBar {...baseProps} resultCount={3} belowField={<Text>CHIPS</Text>} />);
    expect(screen.getByText("CHIPS")).toBeTruthy();
    const order = JSON.stringify(screen.toJSON());
    expect(order.indexOf("CHIPS")).toBeGreaterThan(-1);
    expect(order.indexOf("CHIPS")).toBeLessThan(order.indexOf("3 apartments found"));
  });
});
