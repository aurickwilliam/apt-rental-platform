import type { PropsWithChildren } from "react";
import type { PressableProps, TextInputProps, TextProps } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { BudgetEntrySheet, ExpenseEntrySheet } from "./FinanceEntrySheet";

jest.mock("expo-crypto", () => ({ randomUUID: () => "stable-form-id" }));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetScrollView: jest.requireActual("react-native").ScrollView,
}));
jest.mock("@/service/finance/financeService", () => ({
  financeErrorMessage: () => "Save failed. Try again.",
}));
jest.mock("heroui-native", () => {
  const { Pressable, Text, TextInput, View } =
    jest.requireActual("react-native");
  function Container({ children }: PropsWithChildren) {
    return <View>{children}</View>;
  }
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
  const BottomSheet = Object.assign(Container, {
    Portal: Container,
    Content: Container,
    Overlay: () => null,
    Title: Text,
    Description: Text,
  });
  return {
    BottomSheet,
    Button,
    TextField: Container,
    Label: Text,
    FieldError: Text,
    Input: (props: TextInputProps) => <TextInput {...props} />,
    useBottomSheetAwareHandlers: () => ({}),
  };
});
jest.mock("./FinanceControls", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  return {
    FinanceSelect: ({
      label,
      value,
      options,
      onChange,
      disabled,
    }: {
      label: string;
      value: string;
      options: { value: string; label: string }[];
      onChange: (value: string) => void;
      disabled: boolean;
    }) => (
      <View>
        <Text>
          {label}: {value}
        </Text>
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
    ),
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
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T04:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("invalid amounts and future expenses cannot be saved", () => {
    const onSave = jest.fn();
    const screen = render(
      <ExpenseEntrySheet {...common} onSave={onSave} onDelete={jest.fn()} />,
    );
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "0");
    fireEvent.changeText(
      screen.getByLabelText("Date paid (YYYY-MM-DD)"),
      "2026-10-18",
    );
    fireEvent.press(screen.getByText("Save expense"));
    expect(
      screen.getByText(/positive amount with at most two decimals/),
    ).toBeTruthy();
    expect(screen.getByText(/not future spending/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  test("a valid expense uses a stable UUID and explicit treatment", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <ExpenseEntrySheet {...common} onSave={onSave} onDelete={jest.fn()} />,
    );
    fireEvent.changeText(screen.getByLabelText("Amount (₱)"), "1250.25");
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

  test("an annual bill creates a user-approved monthly reserve suggestion", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <BudgetEntrySheet
        {...common}
        presetCategory="insurance"
        presetKind="reserve"
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    fireEvent.changeText(
      screen.getByLabelText("Amount still needed / annual bill (₱)"),
      "12000",
    );
    fireEvent.press(screen.getByText("Use suggestion"));
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
    expect(screen.getByLabelText("Amount (₱)").props.value).toBe("1000");
    expect(screen.getByLabelText("Description").props.value).toBe("Chair");
    expect(screen.getByText("Expense treatment: capital")).toBeTruthy();
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
    expect(screen.getByText("Category: maintenance")).toBeTruthy();
    expect(screen.getByText("Expense treatment: operating")).toBeTruthy();
  });

  test("reopening the budget planner reuses its fresh plan type, category and months", () => {
    const onSave = jest.fn();
    const screen = render(
      <BudgetEntrySheet
        {...common}
        isOpen={false}
        presetCategory="insurance"
        presetKind="reserve"
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    screen.rerender(
      <BudgetEntrySheet
        {...common}
        isOpen
        presetCategory="insurance"
        presetKind="reserve"
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Plan type: reserve")).toBeTruthy();
    expect(
      screen.getByLabelText("Months to spread this amount over").props.value,
    ).toBe("12");
    screen.rerender(
      <BudgetEntrySheet
        {...common}
        isOpen={false}
        presetCategory="insurance"
        presetKind="reserve"
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    screen.rerender(
      <BudgetEntrySheet
        {...common}
        isOpen
        presetCategory="maintenance"
        presetKind="expense"
        onSave={onSave}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("Plan type: expense")).toBeTruthy();
    expect(screen.getByText("Category: maintenance")).toBeTruthy();
    expect(
      screen.getByLabelText("Months to spread this amount over").props.value,
    ).toBe("6");
    expect(
      screen.getByLabelText("Amount still needed / annual bill (₱)").props
        .value,
    ).toBe("");
  });
});
