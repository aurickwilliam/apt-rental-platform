import type { PropsWithChildren } from "react";
import type { TextInputProps } from "react-native";
import { fireEvent, render, within } from "@testing-library/react-native";
import { findAllInTree } from "../../tests/support/testTraversal";
import FinanceSelect from "./FinanceSelect";

const mockContentProps = jest.fn();
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 62, bottom: 34 }),
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetScrollView: jest.requireActual("react-native").ScrollView,
}));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View, Text, TextInput, Pressable } =
    jest.requireActual("react-native");
  type MockOption = { value: string; label: string };
  const Context = React.createContext({
    open: false,
    setOpen: (_open: boolean) => {},
    value: undefined as MockOption | undefined,
    change: (_option: MockOption) => {},
  });
  function Container({ children }: PropsWithChildren) {
    return <View>{children}</View>;
  }
  function Root({
    children,
    value,
    onValueChange,
    onOpenChange,
  }: PropsWithChildren<{
    value?: MockOption;
    onValueChange: (option: MockOption) => void;
    onOpenChange: (open: boolean) => void;
  }>) {
    const [open, setOpen] = React.useState(false);
    const toggle = (next: boolean) => {
      setOpen(next);
      onOpenChange(next);
    };
    return (
      <Context.Provider
        value={{ open, setOpen: toggle, value, change: onValueChange }}
      >
        {children}
      </Context.Provider>
    );
  }
  function Trigger({
    children,
    isDisabled,
  }: PropsWithChildren<{ isDisabled?: boolean }>) {
    const context = React.useContext(Context);
    return (
      <Pressable
        accessibilityLabel="Property"
        disabled={isDisabled}
        onPress={() => context.setOpen(true)}
      >
        {children}
      </Pressable>
    );
  }
  function Content({ children, ...props }: PropsWithChildren) {
    mockContentProps(props);
    return React.useContext(Context).open ? <View>{children}</View> : null;
  }
  function Item({
    value,
    label,
    className,
  }: MockOption & { className?: string }) {
    const context = React.useContext(Context);
    return (
      <Pressable
        accessibilityLabel={label}
        className={className}
        onPress={() => {
          context.change({ value, label });
          context.setOpen(false);
        }}
      >
        <Text>{label}</Text>
      </Pressable>
    );
  }
  const SearchContext = React.createContext({
    value: "",
    onChange: (_text: string) => {},
  });
  function Search({
    children,
    value,
    onChange,
  }: PropsWithChildren<{ value: string; onChange: (text: string) => void }>) {
    return (
      <SearchContext.Provider value={{ value, onChange }}>
        {children}
      </SearchContext.Provider>
    );
  }
  function SearchInput(props: TextInputProps) {
    const { value, onChange } = React.useContext(SearchContext);
    return <TextInput {...props} value={value} onChangeText={onChange} />;
  }
  function Clear() {
    const { value, onChange } = React.useContext(SearchContext);
    return value ? (
      <Pressable
        accessibilityLabel="Clear property search"
        onPress={() => onChange("")}
      />
    ) : null;
  }
  return {
    Select: Object.assign(Root, {
      Trigger,
      Content,
      Item,
      Portal: Container,
      Overlay: () => null,
      ListLabel: Text,
      Value: () => null,
      TriggerIndicator: () => null,
      ItemLabel: () => null,
      ItemIndicator: () => null,
    }),
    SearchField: Object.assign(Search, {
      Group: Container,
      Input: SearchInput,
      ClearButton: Clear,
      SearchIcon: () => <View testID="search-icon" />,
    }),
    useBottomSheetAwareHandlers: () => ({}),
  };
});

const options = [
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
];
describe("searchable finance property picker", () => {
  beforeEach(() => jest.clearAllMocks());
  test("opens at 90%, fixes search above the scroll area, and highlights the selected property", async () => {
    const screen = await render(
      <FinanceSelect
        label="Property"
        value="villa"
        options={options}
        onChange={jest.fn()}
        searchable
      />,
    );
    await fireEvent.press(screen.getByLabelText("Property"));
    expect(mockContentProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        snapPoints: ["90%"],
        enableDynamicSizing: false,
        topInset: 62,
        keyboardBehavior: "fillParent",
        contentContainerClassName: "h-full",
      }),
    );
    expect(screen.getByTestId("search-icon")).toBeTruthy();
    expect(screen.getByLabelText("Villa").props.className).toContain(
      "bg-primary-light",
    );
    expect(
      within(findAllInTree(screen.root!, (n) => String(n.type) === "RCTScrollView")[0]).queryByLabelText(
        "Search properties",
      ),
    ).toBeNull();
  });
  test("searches, clears, selects immediately, and resets search when reopened", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <FinanceSelect
        label="Property"
        value="villa"
        options={options}
        onChange={onChange}
        searchable
      />,
    );
    await fireEvent.press(screen.getByLabelText("Property"));
    await fireEvent.changeText(screen.getByLabelText("Search properties"), "nothing");
    expect(screen.getByText("No matching properties.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Clear property search"));
    expect(screen.getByLabelText("Villa")).toBeTruthy();
    await fireEvent.changeText(
      screen.getByLabelText("Search properties"),
      "  STUDIO ",
    );
    expect(screen.queryByLabelText("Villa")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Studio"));
    expect(onChange).toHaveBeenCalledWith("studio");
    expect(screen.queryByLabelText("Search properties")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Property"));
    expect(screen.getByLabelText("Search properties").props.value).toBe("");
  });
  test("ordinary selectors open tall enough for the whole option list without search", async () => {
    const screen = await render(
      <FinanceSelect
        label="Category"
        value="villa"
        options={options}
        onChange={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Property"));
    const props = mockContentProps.mock.calls.at(-1)![0];
    // Fixed snap point: an open animation must target a detent that already
    // exists, otherwise the sheet settles short and clips its last option.
    expect(props.snapPoints).toEqual(["85%"]);
    expect(props.enableDynamicSizing).toBe(false);
    expect(screen.getByLabelText("Villa")).toBeTruthy();
    expect(screen.getByLabelText("Studio")).toBeTruthy();
    expect(screen.queryByLabelText("Search properties")).toBeNull();
  });
  test("category selection uses the soft blue row without adding property search", async () => {
    const screen = await render(
      <FinanceSelect
        label="Category"
        value="villa"
        options={options}
        onChange={jest.fn()}
        highlightSelection
      />,
    );
    await fireEvent.press(screen.getByLabelText("Property"));
    expect(screen.getByLabelText("Villa").props.className).toContain(
      "bg-primary-light",
    );
    expect(screen.getByLabelText("Studio").props.className).toBeUndefined();
    expect(screen.queryByLabelText("Search properties")).toBeNull();
    const props = mockContentProps.mock.calls.at(-1)![0];
    expect(props.snapPoints).toEqual(["85%"]);
    expect(props.enableDynamicSizing).toBe(false);
  });
  test("expense treatment can open at a fixed 50% without content resizing", async () => {
    const screen = await render(
      <FinanceSelect
        label="Expense treatment"
        value="villa"
        options={options}
        onChange={jest.fn()}
        sheetHeight="50%"
        highlightSelection
      />,
    );
    await fireEvent.press(screen.getByLabelText("Property"));
    expect(mockContentProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        snapPoints: ["50%"],
        enableDynamicSizing: false,
      }),
    );
    expect(screen.getByLabelText("Villa").props.className).toContain(
      "bg-primary-light",
    );
    expect(screen.getByLabelText("Studio").props.className).toBeUndefined();
  });
  test("required selectors show the marker and inline validation error", async () => {
    const screen = await render(<FinanceSelect label="Category" value="" options={options} onChange={jest.fn()} required error="Choose an expense category." />);
    expect(screen.getByText("Category *")).toBeTruthy();
    expect(screen.getByText("Category *").props.className).toContain("font-nunitoSemiBold");
    expect(screen.getByText("Category *").props.className).toContain("text-base");
    expect(screen.getByText("Category *").props.className).toContain("text-danger");
    expect(screen.getByRole("alert").props.children).toBe("Choose an expense category.");
  });
  // The sheet container already pads 20px; the option list adds 12px more so the
  // row pills clear the sheet edges, and the label, the search field and the
  // list share that one inset so they stay aligned.
  test("the label, search field and option list share one horizontal inset", async () => {
    const screen = await render(
      <FinanceSelect
        label="Category"
        value="villa"
        options={options}
        onChange={jest.fn()}
        searchable
        highlightSelection
      />,
    );
    await fireEvent.press(screen.getByLabelText("Property"));
    expect(
      findAllInTree(screen.root!, (n) => String(n.type) === "RCTScrollView")[0].props.contentContainerStyle,
    ).toEqual(expect.objectContaining({ paddingHorizontal: 12 }));
    // The sheet's own label (not the field label above the trigger) shares the
    // list's inset.
    const sheetLabel = findAllInTree(screen.root!, (n) => String(n.type) === "Text")
      .find((node) => node.props.className?.includes("px-3"));
    expect(sheetLabel?.props.className).toContain("font-nunitoBold");
    const searchWrapper = findAllInTree(screen.root!, (n) => String(n.type) === "View")
      .find((node) => node.props.className?.includes("px-3"));
    expect(searchWrapper?.props.className).toContain("px-3");
    expect(
      searchWrapper?.queryAll((n) => n.props.accessibilityLabel === "Search properties"),
    ).not.toHaveLength(0);
  });
});
