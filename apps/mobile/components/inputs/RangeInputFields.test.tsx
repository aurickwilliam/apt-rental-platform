import { fireEvent, render, screen } from "@testing-library/react-native";

import RangeInputFields from "./RangeInputFields";

jest.mock("heroui-native", () => {
  const { Text, TextInput, View } = jest.requireActual("react-native");
  const Label = Object.assign(({ children }: { children: unknown }) => <View>{children as never}</View>, {
    Text: ({ children }: { children: unknown }) => <Text>{children as never}</Text>,
  });
  const InputGroup = Object.assign(({ children }: { children: unknown }) => <View>{children as never}</View>, {
    Prefix: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    Suffix: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    Input: (props: object) => <TextInput {...props} />,
  });
  return {
    InputGroup,
    Label,
    TextField: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    useBottomSheetAwareHandlers: () => ({ onFocus: jest.fn(), onBlur: jest.fn() }),
  };
});

const budget = { absoluteMin: 1000, absoluteMax: 50000, step: 500, prefix: "₱", minLabel: "Minimum budget", maxLabel: "Maximum budget" };

async function setup(min = 1000, max = 50000, overrides = {}) {
  const onCommit = jest.fn();
  const utils = await render(<RangeInputFields {...budget} min={min} max={max} onCommit={onCommit} {...overrides} />);
  return { onCommit, ...utils };
}

describe("RangeInputFields", () => {
  it("shows the committed range with its affixes", async () => {
    await setup(5000, 30000);
    expect(screen.getByLabelText("Minimum budget").props.value).toBe("5000");
    expect(screen.getByLabelText("Maximum budget").props.value).toBe("30000");
    expect(screen.getAllByText("₱")).toHaveLength(2);
    expect(screen.getByText("Min")).toBeTruthy();
    expect(screen.getByText("Max")).toBeTruthy();
  });

  it("commits a typed minimum when editing ends, snapped to the step", async () => {
    const { onCommit } = await setup();
    const field = screen.getByLabelText("Minimum budget");
    await fireEvent.changeText(field, "12,300");
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Minimum budget").props.value).toBe("12,300");
    await fireEvent(field, "endEditing");
    expect(onCommit).toHaveBeenCalledWith([12500, 50000]);
  });

  it("clamps to the slider ends and to the other side", async () => {
    const { onCommit } = await setup(5000, 30000);
    await fireEvent.changeText(screen.getByLabelText("Maximum budget"), "999999");
    await fireEvent(screen.getByLabelText("Maximum budget"), "endEditing");
    expect(onCommit).toHaveBeenLastCalledWith([5000, 50000]);
    await fireEvent.changeText(screen.getByLabelText("Minimum budget"), "40000");
    await fireEvent(screen.getByLabelText("Minimum budget"), "endEditing");
    expect(onCommit).toHaveBeenLastCalledWith([30000, 30000]);
  });

  it("does not commit when nothing changed or the draft is empty", async () => {
    const { onCommit } = await setup(5000, 30000);
    await fireEvent(screen.getByLabelText("Minimum budget"), "endEditing");
    await fireEvent.changeText(screen.getByLabelText("Minimum budget"), "");
    await fireEvent(screen.getByLabelText("Minimum budget"), "endEditing");
    await fireEvent.changeText(screen.getByLabelText("Maximum budget"), "30000");
    await fireEvent(screen.getByLabelText("Maximum budget"), "endEditing");
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Minimum budget").props.value).toBe("5000");
  });

  it("drops a draft when the range changes from outside (slider, Clear All)", async () => {
    const { rerender } = await setup(5000, 30000);
    await fireEvent.changeText(screen.getByLabelText("Minimum budget"), "77");
    expect(screen.getByLabelText("Minimum budget").props.value).toBe("77");
    await rerender(<RangeInputFields {...budget} min={8000} max={30000} onCommit={jest.fn()} />);
    expect(screen.getByLabelText("Minimum budget").props.value).toBe("8000");
  });

  it("snaps size to its own step and shows the unit", async () => {
    const { onCommit } = await setup(10, 300, { absoluteMin: 10, absoluteMax: 300, step: 5, prefix: undefined, suffix: "sqm", minLabel: "Minimum size", maxLabel: "Maximum size" });
    await fireEvent.changeText(screen.getByLabelText("Minimum size"), "47");
    await fireEvent(screen.getByLabelText("Minimum size"), "endEditing");
    expect(onCommit).toHaveBeenCalledWith([45, 300]);
    expect(screen.getAllByText("sqm")).toHaveLength(2);
  });
});
