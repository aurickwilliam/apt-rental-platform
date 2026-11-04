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
  it("shows All cities for CAMANAVA, then each city, with the current one filled", () => {
    render(<CityChips cities={CITIES} selectedCity="Malabon" onSelectCity={jest.fn()} />);
    for (const label of ["All cities", "Caloocan", "Malabon", "Navotas", "Valenzuela"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("CAMANAVA")).toBeNull();
    expect(screen.getAllByTestId("chip-primary")).toHaveLength(1);
    expect(screen.getAllByTestId("chip-secondary")).toHaveLength(4);
  });

  it("switches to a tapped city", () => {
    const onSelectCity = jest.fn();
    render(<CityChips cities={CITIES} selectedCity="CAMANAVA" onSelectCity={onSelectCity} />);
    fireEvent.press(screen.getByText("Navotas"));
    expect(onSelectCity).toHaveBeenCalledWith("Navotas");
  });

  it("returns to all cities when the current city is tapped again, and All cities stays put", () => {
    const onSelectCity = jest.fn();
    const { rerender } = render(<CityChips cities={CITIES} selectedCity="Navotas" onSelectCity={onSelectCity} />);
    fireEvent.press(screen.getByText("Navotas"));
    expect(onSelectCity).toHaveBeenLastCalledWith("CAMANAVA");
    rerender(<CityChips cities={CITIES} selectedCity="CAMANAVA" onSelectCity={onSelectCity} />);
    fireEvent.press(screen.getByText("All cities"));
    expect(onSelectCity).toHaveBeenLastCalledWith("CAMANAVA");
  });
});
