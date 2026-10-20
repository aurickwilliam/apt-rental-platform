import type { PropsWithChildren, ReactNode } from "react";
import type { PressableProps, TextInputProps, TextProps } from "react-native";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import type { FinanceBudget } from "@repo/utils";
import { BudgetEntryPage, ExpenseEntrySheet, ExpenseEntryPage } from "./FinanceEntrySheet";

jest.mock("@/components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual("react-native");
  return function Wrapper({ children, footer }: PropsWithChildren<{ footer: ReactNode }>) {
    return <View><View testID="entry-page-form">{children}</View><View testID="entry-page-footer">{footer}</View></View>;
  };
});
jest.mock("@/components/layout/StandardHeader", () => () => null);
jest.mock("@/components/inputs/DateField", () => {
  const { View, Text } = jest.requireActual("react-native");
  return function DatePicker({ label, value, onChange, maximumDate, error }: { label: string; value: Date; onChange: (date: Date) => void; maximumDate: Date; error?: string }) {
    return <View accessibilityLabel={label} value={value} maximumDate={maximumDate} onDateChange={onChange}><Text>{error}</Text></View>;
  };
});

jest.mock("expo-crypto", () => ({ randomUUID: () => "stable-form-id" }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetScrollView: jest.requireActual("react-native").ScrollView,
  BottomSheetFooter: ({ children }: PropsWithChildren) => {
    const { View } = jest.requireActual("react-native");
    return <View>{children}</View>;
  },
}));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Save failed. Try again.",
}));
const mockPortalProps = jest.fn();
jest.mock("heroui-native", () => {
  const { createContext, useContext } = jest.requireActual("react");
  const { Pressable, Text, TextInput, View } =
    jest.requireActual("react-native");
  // HeroUI's Label marks a required TextField with an asterisk; mirror that so
  // tests can assert required fields.
  const RequiredContext = createContext(false);
  function Container({
    children,
    isRequired,
  }: PropsWithChildren<{ isRequired?: boolean }>) {
    return (
      <RequiredContext.Provider value={!!isRequired}>
        <View>{children}</View>
      </RequiredContext.Provider>
    );
  }
  function Label({ children, className }: TextProps) {
    return <View className={className}>{children}</View>;
  }
  Label.Text = function LabelText({ children, className }: TextProps) {
    return (
      <Text className={className}>
        {children}
        {useContext(RequiredContext) ? " *" : ""}
      </Text>
    );
  };
  function Button({
    children,
    onPress,
    isDisabled,
  }: PropsWithChildren<PressableProps & { isDisabled?: boolean }>) {
    return (
      <Pressable onPress={onPress} disabled={isDisabled}>
        {children}
      </Pressable>
    );
  }
  Button.Label = function ButtonLabel({ children }: TextProps) {
    return <Text>{children}</Text>;
  };
  function BottomSheetPortal(props: PropsWithChildren<{ disableFullWindowOverlay?: boolean }>) {
    mockPortalProps(props);
    return <View>{props.children}</View>;
  }
  function BottomSheetContent({
    children,
    footerComponent: Footer,
  }: PropsWithChildren<{ footerComponent?: (props: object) => ReactNode }>) {
    return <View>{children}{Footer?.({})}</View>;
  }
  const BottomSheet = Object.assign(Container, {
    Portal: BottomSheetPortal,
    Content: BottomSheetContent,
    Overlay: () => null,
    Title: Text,
    Description: Text,
  });
  return {
    BottomSheet,
    Button,
    TextField: Container,
    Label,
    FieldError: Text,
    Input: (props: TextInputProps) => <TextInput {...props} />,
    useBottomSheetAwareHandlers: () => ({}),
  };
});
// Fixed sheet heights per selector label, so a regression back to a
// content-measured sheet is caught here instead of on a device.
const mockSelectSheetHeights = new Map<string, string | undefined>();
// Which selectors highlight their selected row with the soft-blue pill.
const mockSelectHighlight = new Map<string, boolean | undefined>();

jest.mock("./FinanceControls", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  return {
    FinanceSelect: ({
      label,
      value,
      options,
      onChange,
      disabled,
      searchable,
      required,
      error,
      sheetHeight,
      highlightSelection,
    }: {
      label: string;
      value: string;
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
      disabled: boolean;
      searchable?: boolean;
      required?: boolean;
      error?: string;
      sheetHeight?: string;
      highlightSelection?: boolean;
    }) => {
      mockSelectSheetHeights.set(label, sheetHeight);
      mockSelectHighlight.set(label, highlightSelection);
      return (
        <View testID={searchable ? "searchable-property-picker" : undefined}>
          <Text>
            {label}
            {required ? " *" : ""}: {value}
          </Text>
          {error && <Text accessibilityRole="alert">{error}</Text>}
          {options.map((option) => (
            <Pressable
              key={option.value}
              disabled={disabled}
              accessibilityLabel={`${label}: ${option.label}`}
              onPress={() => onChange(option.value)}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      );
    },
  };
});

const common = {
  isOpen: true,
  properties: [{ id: "apt", name: "Villa" }],
  apartmentId: "apt",
  month: "2026-10",
  onClose: jest.fn(),
};

describe("finance entry forms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectSheetHeights.clear();
    mockSelectHighlight.clear();
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("the add page keeps Save and Cancel outside the form and uses the shared validation and save", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(<ExpenseEntryPage {...common} onSave={onSave} />);
    expect(within(screen.getByTestId("entry-page-form")).queryByText("Save expense")).toBeNull();
    expect(within(screen.getByTestId("entry-page-footer")).getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Property *: apt")).toBeTruthy();
    expect(screen.getAllByTestId("searchable-property-picker")).toHaveLength(1);
    // The expense option sheets highlight their selected row with the same
    // soft-blue pill as the budget form's Plan type sheet.
    expect(mockSelectHighlight.get("Category")).toBe(true);
    expect(mockSelectHighlight.get("Expense treatment")).toBe(true);
    fireEvent.press(screen.getByText("Save expense"));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "2500");
    fireEvent.changeText(screen.getByLabelText("Description"), "AC repair");
    fireEvent.press(screen.getByText("Save expense"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ apartment_id: "apt", amount: 2500, description: "AC repair" }), false));
    expect(common.onClose).toHaveBeenCalled();
  });

  test("expense amount formats typing and pasted pesos, preserves decimals, and can be cleared", () => {
    const screen = render(<ExpenseEntryPage {...common} onSave={jest.fn()} />);
    const field = () => screen.getByLabelText("Amount (₱)");
    fireEvent.changeText(field(), "1000");
    expect(field().props.value).toBe("₱ 1,000");
    fireEvent.changeText(field(), "₱ 1,000.");
    expect(field().props.value).toBe("₱ 1,000.");
    fireEvent.changeText(field(), "₱ 999,999,999.99");
    expect(field().props.value).toBe("₱ 999,999,999.99");
    expect(field().props.maxLength).toBeGreaterThanOrEqual(field().props.value.length);
    fireEvent.changeText(field(), "");
    expect(field().props.value).toBe("");
  });

  test("the date picker limits future days and saves the selected calendar day without timezone conversion", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(<ExpenseEntryPage {...common} onSave={onSave} />);
    expect(screen.getByLabelText("Date paid").props.maximumDate).toEqual(new Date(2026, 9, 17, 12));
    fireEvent(screen.getByLabelText("Date paid"), "dateChange", new Date(2026, 9, 5, 12));
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "1000");
    fireEvent.changeText(screen.getByLabelText("Description"), "Repair");
    fireEvent.press(screen.getByText("Save expense"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ spent_on: "2026-10-05" }), false));
  });

  test("required selection errors appear after Save and clear when corrected", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(<ExpenseEntryPage {...common} apartmentId="unowned" category="emergency" onSave={onSave} />);
    expect(screen.queryByText("Choose one of your properties.")).toBeNull();
    fireEvent.press(screen.getByText("Save expense"));
    expect(screen.getByText("Choose one of your properties.")).toBeTruthy();
    expect(screen.getByLabelText("Amount (₱)").props.className).toBe(
      "font-inter text-sm text-foreground finance-field-invalid",
    );
    expect(screen.getByLabelText("Description").props.className).toBe(
      "font-inter text-sm text-foreground finance-field-invalid",
    );
    expect(screen.getByLabelText("Description").props.style).toEqual({ borderColor: "#E50914", borderWidth: 2 });
    expect(screen.getByLabelText("Amount (₱)").props.style).toEqual({ borderColor: "#E50914", borderWidth: 2 });
    expect(screen.getByText("Choose an expense category.")).toBeTruthy();
    expect(screen.getByText("Describe this expense.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.press(screen.getByLabelText("Category: Maintenance & repairs"));
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "1000");
    fireEvent.changeText(screen.getByLabelText("Description"), "Repair");
    expect(screen.queryByText("Choose one of your properties.")).toBeNull();
    expect(screen.getByLabelText("Amount (₱)").props.className).toBe(
      "font-inter text-sm text-foreground",
    );
    expect(screen.getByLabelText("Description").props.className).toBe(
      "font-inter text-sm text-foreground",
    );
    expect(screen.getByLabelText("Description").props.style).toBeUndefined();
    expect(screen.queryByText("Choose an expense category.")).toBeNull();
    fireEvent.press(screen.getByText("Save expense"));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  test("invalid amounts and future expenses cannot be saved", () => {
    const onSave = jest.fn();
    const screen = render(
      <ExpenseEntrySheet {...common} onSave={onSave} onDelete={jest.fn()} />,
    );
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "0");
    fireEvent(screen.getByLabelText("Date paid"), "dateChange", new Date(2026, 9, 18, 12));
    fireEvent.press(screen.getByText("Save expense"));
    expect(
      screen.getByText(/positive amount with at most two decimals/),
    ).toBeTruthy();
    expect(screen.getByText(/not future spending/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  // DateField opens the iOS picker as a React Native Modal, and the default
  // iOS full-window overlay renders above native modals — the picker would
  // open invisibly behind the sheet.
  test("the expense sheet renders without the iOS full-window overlay so the date picker can appear above it", () => {
    render(<ExpenseEntrySheet {...common} onSave={jest.fn()} onDelete={jest.fn()} />);
    expect(mockPortalProps).toHaveBeenCalledWith(
      expect.objectContaining({ disableFullWindowOverlay: true }),
    );
  });

  // HeroUI's sheet container already applies the shared 20px gutter; the scroll
  // content must not pad horizontally a second time.
  test("the expense sheet scroll adds vertical spacing only inside the 20px sheet gutter", () => {
    const screen = render(
      <ExpenseEntrySheet {...common} onSave={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(
      screen.getByTestId("expense-sheet-scroll").props.contentContainerStyle,
    ).toEqual({ paddingBottom: 32 });
  });

  test("a valid expense uses a stable UUID and explicit treatment", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <ExpenseEntrySheet {...common} onSave={onSave} onDelete={jest.fn()} />,
    );
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "1250.25");
    expect(screen.getByLabelText("Amount (₱)").props.value).toBe("₱ 1,250.25");
    fireEvent.changeText(
      screen.getByLabelText("Description"),
      "  Sink repair  ",
    );
    fireEvent.press(screen.getByText("Save expense"));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        {
          id: "stable-form-id",
          apartment_id: "apt",
          category: "maintenance",
          treatment: "operating",
          amount: 1250.25,
          spent_on: "2026-10-17",
          description: "Sink repair",
        },
        false,
      ),
    );
    expect(common.onClose).toHaveBeenCalled();
  });

  test("deleting an expense needs explicit confirmation", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <ExpenseEntrySheet
        {...common}
        initial={{
          id: "existing",
          apartment_id: "apt",
          amount: 1000,
          category: "furniture",
          treatment: "capital",
          spent_on: "2026-10-01",
          description: "Chair",
        }}
        onSave={jest.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.press(screen.getByText("Delete expense"));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Confirm delete"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("existing"));
  });

  test("the budget page keeps Save and Cancel in an equal-width footer row and marks required fields", () => {
    const screen = render(
      <BudgetEntryPage
        properties={common.properties}
        apartmentId="apt"
        month="2026-10"
        presetCategory="insurance"
        presetKind="reserve"
        onClose={common.onClose}
        onSave={jest.fn()}
      />,
    );
    expect(
      within(screen.getByTestId("entry-page-form")).queryByText("Save budget"),
    ).toBeNull();
    const footer = screen.getByTestId("entry-page-footer");
    expect(within(footer).getByText("Cancel")).toBeTruthy();
    expect(within(footer).getByText("Save budget")).toBeTruthy();
    expect(footer.findAllByProps({ className: "flex-1" })).toHaveLength(2);
    expect(screen.getAllByTestId("searchable-property-picker")).toHaveLength(1);
    expect(screen.getByText("Property *: apt")).toBeTruthy();
    expect(screen.getByText("Plan type *: reserve")).toBeTruthy();
    expect(screen.getByText("Category *: insurance")).toBeTruthy();
    // Short lists name their height; longer lists fall back to the
    // FinanceSelect default instead of a content-measured sheet.
    expect(mockSelectSheetHeights.get("Plan type")).toBe("50%");
    expect(mockSelectSheetHeights.get("Category")).toBeUndefined();
    // Every option sheet highlights its selected row with the same soft-blue
    // pill, so Plan type matches Category.
    expect(mockSelectHighlight.get("Plan type")).toBe(true);
    expect(mockSelectHighlight.get("Category")).toBe(true);
    expect(
      screen.getByText("Planned allocation this month (₱) *"),
    ).toBeTruthy();
    expect(
      screen.getByText("Planned allocation this month (₱) *").props.className,
    ).toBe("font-nunitoSemiBold text-base text-foreground");
    // The goal calculator is one button on the form; its fields live in a sheet.
    const form = screen.getByTestId("entry-page-form");
    expect(within(form).getByText("Calculate from a goal")).toBeTruthy();
    expect(within(form).queryByLabelText("Amount still needed or annual bill (₱)")).toBeNull();
    expect(within(form).queryByLabelText("Months to spread this amount over")).toBeNull();
    const goalSheet = screen.getByTestId("budget-goal-sheet");
    // The optional goal inputs are never required, so they carry no asterisk.
    expect(
      within(goalSheet).getByLabelText("Amount still needed or annual bill (₱)"),
    ).toBeTruthy();
    expect(
      within(goalSheet).getByLabelText("Months to spread this amount over"),
    ).toBeTruthy();
    expect(within(goalSheet).queryByText("Amount still needed or annual bill (₱) *")).toBeNull();
    expect(within(goalSheet).queryByText("Months to spread this amount over *")).toBeNull();
  });

  test("budget field errors appear after Save, redden their inputs and clear when corrected", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <BudgetEntryPage
        properties={common.properties}
        apartmentId="unowned"
        month="2026-10"
        onClose={common.onClose}
        onSave={onSave}
      />,
    );
    expect(screen.queryByText("Choose one of your properties.")).toBeNull();
    fireEvent.press(screen.getByText("Save budget"));
    expect(screen.getByText("Choose one of your properties.")).toBeTruthy();
    expect(
      screen.getByText(
        "Enter zero or a positive amount with at most two decimals.",
      ),
    ).toBeTruthy();
    const limit = screen.getByLabelText("Monthly spending limit (₱)");
    expect(limit.props.className).toBe(
      "font-inter text-sm text-foreground finance-field-invalid",
    );
    expect(limit.props.style).toEqual({ borderColor: "#E50914", borderWidth: 2 });
    expect(
      screen.getByText("Monthly spending limit (₱) *").props.className,
    ).toBe("font-nunitoSemiBold text-base text-danger");
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Property: Villa"));
    fireEvent.changeText(screen.getByLabelText("Monthly spending limit (₱)"), "5000");
    expect(screen.queryByText("Choose one of your properties.")).toBeNull();
    expect(screen.getByLabelText("Monthly spending limit (₱)").props.value).toBe(
      "₱ 5,000",
    );
    expect(
      screen.getByLabelText("Monthly spending limit (₱)").props.className,
    ).toBe("font-inter text-sm text-foreground");
    expect(
      screen.getByLabelText("Monthly spending limit (₱)").props.style,
    ).toBeUndefined();
    fireEvent.press(screen.getByText("Save budget"));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ apartment_id: "apt", amount: 5000 }),
      ),
    );
  });

  test("the goal sheet calculates a suggestion the landlord must apply", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <BudgetEntryPage
        properties={common.properties}
        apartmentId="apt"
        month="2026-10"
        onClose={common.onClose}
        onSave={onSave}
      />,
    );
    const sheet = () => screen.getByTestId("budget-goal-sheet");
    const goalAmount = () =>
      within(sheet()).getByLabelText("Amount still needed or annual bill (₱)");
    const goalMonths = () =>
      within(sheet()).getByLabelText("Months to spread this amount over");
    fireEvent.changeText(
      screen.getByLabelText("Monthly spending limit (₱)"),
      "2000",
    );
    fireEvent.press(
      within(screen.getByTestId("entry-page-form")).getByText(
        "Calculate from a goal",
      ),
    );
    // The goal fields validate while typing; nothing invalid reaches the form.
    fireEvent.changeText(goalAmount(), "12.345");
    expect(
      within(sheet()).getByText(
        "Enter a positive amount with at most two decimals.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Use suggested amount"),
    ).toBeDisabled();
    expect(within(sheet()).queryByText("Save goal only")).toBeNull();
    expect(within(sheet()).queryByText("Cancel")).toBeNull();
    fireEvent.press(screen.getByText("Use suggested amount"));
    expect(
      screen.getByLabelText("Monthly spending limit (₱)").props.value,
    ).toBe("₱ 2,000");
    fireEvent.changeText(goalAmount(), "12000");
    expect(goalAmount().props.value).toBe("₱ 12,000");
    fireEvent.changeText(goalMonths(), "0");
    expect(
      within(sheet()).getByText("Enter a whole number from 1 to 600."),
    ).toBeTruthy();
    fireEvent.changeText(goalMonths(), "12");
    expect(within(sheet()).getByText("Suggested: ₱ 1,000 / month")).toBeTruthy();
    fireEvent.press(screen.getByText("Use suggested amount"));
    // The suggestion only fills the allocation; the landlord still saves.
    expect(
      screen.getByLabelText("Monthly spending limit (₱)").props.value,
    ).toBe("₱ 1,000");
    expect(
      within(screen.getByTestId("entry-page-form")).queryByText(
        "₱ 12,000 over 12 months",
      ),
    ).toBeNull();
    expect(
      within(screen.getByTestId("entry-page-form")).queryByText(
        "Suggested ₱ 1,000 / month",
      ),
    ).toBeNull();
    fireEvent.press(screen.getByText("Save budget"));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          target_amount: 12000,
          months_remaining: 12,
        }),
      ),
    );
  });

  test("an annual bill creates a user-approved monthly reserve suggestion", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <BudgetEntryPage
        properties={common.properties}
        apartmentId="apt"
        month="2026-10"
        presetCategory="insurance"
        presetKind="reserve"
        onClose={common.onClose}
        onSave={onSave}
      />,
    );
    const sheet = () => screen.getByTestId("budget-goal-sheet");
    fireEvent.press(
      within(screen.getByTestId("entry-page-form")).getByText(
        "Calculate from a goal",
      ),
    );
    fireEvent.changeText(
      within(sheet()).getByLabelText("Amount still needed or annual bill (₱)"),
      "12000",
    );
    // Insurance presets a 12-month horizon.
    expect(
      within(sheet()).getByLabelText("Months to spread this amount over").props
        .value,
    ).toBe("12");
    fireEvent.press(screen.getByText("Use suggested amount"));
    fireEvent.press(screen.getByText("Save budget"));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        apartment_id: "apt",
        month: "2026-10",
        category: "insurance",
        kind: "reserve",
        amount: 1000,
        target_amount: 12000,
        months_remaining: 12,
      }),
    );
  });

  test("failed saves retain the expense draft and show an error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const screen = render(
      <ExpenseEntrySheet
        {...common}
        onSave={jest.fn().mockRejectedValue(new Error("network"))}
        onDelete={jest.fn()}
      />,
    );
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "1500");
    fireEvent.changeText(screen.getByLabelText("Description"), "Repair");
    fireEvent.press(screen.getByText("Save expense"));
    await waitFor(() =>
      expect(screen.getByText("Save failed. Try again.")).toBeTruthy(),
    );
    expect(screen.getByLabelText("Description").props.value).toBe("Repair");
    expect(common.onClose).not.toHaveBeenCalled();
  });

  // Sheets stay mounted while closed (HeroUI only snaps them open on a closed → open
  // transition), so each opening has to reseed the draft from the request.
  test("reopening an expense sheet starts a fresh draft", () => {
    const onSave = jest.fn();
    const editRow = {
      id: "existing",
      apartment_id: "apt",
      amount: 1000,
      category: "furniture" as const,
      treatment: "capital" as const,
      spent_on: "2026-10-02",
      description: "Chair",
    };
    const screen = render(
      <ExpenseEntrySheet
        {...common}
        isOpen={false}
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    screen.rerender(
      <ExpenseEntrySheet
        {...common}
        isOpen
        initial={editRow}
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Edit expense")).toBeTruthy();
    expect(screen.getByLabelText("Amount (₱)").props.value).toBe("₱ 1,000");
    expect(screen.getByLabelText("Description").props.value).toBe("Chair");
    expect(screen.getByText("Expense treatment *: capital")).toBeTruthy();
    screen.rerender(
      <ExpenseEntrySheet
        {...common}
        isOpen={false}
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    screen.rerender(
      <ExpenseEntrySheet
        {...common}
        isOpen
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Add expense")).toBeTruthy();
    expect(screen.getByLabelText("Amount (₱)").props.value).toBe("");
    expect(screen.getByLabelText("Description").props.value).toBe("");
    expect(screen.getByText("Category *: maintenance")).toBeTruthy();
    expect(screen.getByText("Expense treatment *: operating")).toBeTruthy();
  });

  test("the edit page seeds the form from the tapped budget and locks its identity", () => {
    const budget: FinanceBudget = {
      id: "existing",
      apartment_id: "apt",
      month: "2026-10",
      category: "insurance",
      kind: "reserve",
      amount: 1000,
      target_amount: 12000,
      months_remaining: 12,
    };
    const screen = render(
      <BudgetEntryPage
        {...common}
        initial={budget}
        onSave={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Plan type *: reserve")).toBeTruthy();
    expect(screen.getByText("Category *: insurance")).toBeTruthy();
    expect(screen.getByLabelText("Planned allocation this month (₱)").props.value).toBe("₱ 1,000");
    fireEvent.press(
      within(screen.getByTestId("entry-page-form")).getByText("Change goal"),
    );
    const goalSheet = screen.getByTestId("budget-goal-sheet");
    expect(
      within(goalSheet).getByLabelText("Amount still needed or annual bill (₱)").props.value,
    ).toBe("₱ 12,000");
    expect(
      within(goalSheet).getByLabelText("Months to spread this amount over").props.value,
    ).toBe("12");
    // The footer keeps its equal-width Cancel / Save pair, and removal sits in the form.
    const footer = screen.getByTestId("entry-page-footer");
    expect(within(footer).getByText("Cancel")).toBeTruthy();
    expect(within(footer).getByText("Save budget")).toBeTruthy();
    expect(footer.findAllByProps({ className: "flex-1" })).toHaveLength(2);
    expect(
      within(screen.getByTestId("entry-page-form")).getByText("Remove budget"),
    ).toBeTruthy();
  });

  test("a suggested amount seeds the edit form without touching the goal fields", () => {
    const budget: FinanceBudget = {
      id: "existing",
      apartment_id: "apt",
      month: "2026-10",
      category: "insurance",
      kind: "reserve",
      amount: 500,
      target_amount: 12000,
      months_remaining: 12,
    };
    const screen = render(
      <BudgetEntryPage
        {...common}
        initial={budget}
        suggestedAmount={1000}
        onSave={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Planned allocation this month (₱)").props.value).toBe("₱ 1,000");
    expect(
      within(screen.getByTestId("entry-page-form")).queryByText("₱ 12,000 over 12 months"),
    ).toBeNull();
  });

  test("removing a budget from the edit page needs explicit confirmation", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const budget: FinanceBudget = {
      id: "existing",
      apartment_id: "apt",
      month: "2026-10",
      category: "maintenance",
      kind: "expense",
      amount: 2000,
      target_amount: null,
      months_remaining: null,
    };
    const screen = render(
      <BudgetEntryPage
        {...common}
        initial={budget}
        onSave={jest.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.press(screen.getByText("Remove budget"));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Confirm remove budget"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("existing"));
  });
});
