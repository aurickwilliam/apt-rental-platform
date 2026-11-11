import { fireEvent, render, screen } from "@testing-library/react-native";

import CityChips from "./CityChips";

jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  const Chip = Object.assign(
    ({ children, onPress, accessibilityState, variant }: { children: unknown; onPress: () => void; accessibilityState: object; variant: string }) => (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={accessibilityState} testID={`chip-${variant}`}>
        {children as never}
      </Pressable>
    ),
    { Label: ({ children }: { children: unknown }) => <Text>{children as never}</Text> },
  );
  return { Chip };
});

const CITIES = ["CAMANAVA", "Caloocan", "Malabon", "Navotas", "Valenzuela"];

describe("CityChips", () => {
  it("shows All cities for CAMANAVA, then each city, with the current one filled", async () => {
    await render(<CityChips cities={CITIES} selectedCity="Malabon" onSelectCity={jest.fn()} />);
    for (const label of ["All cities", "Caloocan", "Malabon", "Navotas", "Valenzuela"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("CAMANAVA")).toBeNull();
    expect(screen.getAllByTestId("chip-primary")).toHaveLength(1);
    expect(screen.getAllByTestId("chip-secondary")).toHaveLength(4);
  });

  it("switches to a tapped city", async () => {
    const onSelectCity = jest.fn();
    await render(<CityChips cities={CITIES} selectedCity="CAMANAVA" onSelectCity={onSelectCity} />);
    await fireEvent.press(screen.getByText("Navotas"));
    expect(onSelectCity).toHaveBeenCalledWith("Navotas");
  });

  it("returns to all cities when the current city is tapped again, and All cities stays put", async () => {
    const onSelectCity = jest.fn();
    const { rerender } = await render(<CityChips cities={CITIES} selectedCity="Navotas" onSelectCity={onSelectCity} />);
    await fireEvent.press(screen.getByText("Navotas"));
    expect(onSelectCity).toHaveBeenLastCalledWith("CAMANAVA");
    await rerender(<CityChips cities={CITIES} selectedCity="CAMANAVA" onSelectCity={onSelectCity} />);
    await fireEvent.press(screen.getByText("All cities"));
    expect(onSelectCity).toHaveBeenLastCalledWith("CAMANAVA");
  });
});
