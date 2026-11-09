import type { ReactNode } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import ElectricityMeterConfirmation from "@/components/inputs/ElectricityMeterConfirmation";
import ApartmentDetailsSection from "@/app/apartment/[apartmentId]/components/sections/ApartmentDetailsSection";
import type { ApartmentDetails } from "@/service/apartments/apartmentDetailsService";
import { useApartmentFormStore } from "@/stores/useApartmentFormStore";
import {
  getOwnElectricityMeterDetail,
  getOwnElectricityMeterError,
  OWN_ELECTRICITY_METER_CONFIRMATION,
  OWN_ELECTRICITY_METER_DESCRIPTION,
  OWN_ELECTRICITY_METER_DETAIL,
  OWN_ELECTRICITY_METER_ERROR,
  OWN_ELECTRICITY_METER_FIELD_LABEL,
} from "@repo/constants";

jest.mock("hooks/useTheme", () => ({ useColors: () => ({ colors: { gray500: "#626B73" } }) }));
jest.mock("@tabler/icons-react-native", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { IconUsers: View, IconBuilding: View, IconHome: View, IconCalendar: View, IconBolt: View };
});
jest.mock("heroui-native", () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  const ControlField = ({ children, isSelected, onSelectedChange, isDisabled }: {
    children: ReactNode; isSelected: boolean; onSelectedChange: (value: boolean) => void; isDisabled?: boolean;
  }) => (
    <Pressable accessibilityRole="checkbox" accessibilityLabel="Meter confirmation" accessibilityState={{ checked: isSelected, disabled: isDisabled }} disabled={isDisabled} onPress={() => onSelectedChange(!isSelected)}>
      {children}
    </Pressable>
  );
  ControlField.Indicator = View;
  return { ControlField, Checkbox: View, Label: Text, Description: Text, FieldError: Text };
});

beforeEach(() => useApartmentFormStore.getState().reset());

it("starts unchecked and clears confirmation when a draft is reset", () => {
  expect(useApartmentFormStore.getState().hasOwnElectricityMeter).toBe(false);
  useApartmentFormStore.getState().setField("hasOwnElectricityMeter", true);
  expect(useApartmentFormStore.getState().hasOwnElectricityMeter).toBe(true);
  useApartmentFormStore.getState().reset();
  expect(useApartmentFormStore.getState().hasOwnElectricityMeter).toBe(false);
});

it("renders the requirement and inline error and lets the landlord confirm", () => {
  const onSelectedChange = jest.fn();
  const screen = render(<ElectricityMeterConfirmation isSelected={false} onSelectedChange={onSelectedChange} error={OWN_ELECTRICITY_METER_ERROR} />);
  expect(screen.getByText(OWN_ELECTRICITY_METER_CONFIRMATION)).toBeTruthy();
  expect(screen.getByText(OWN_ELECTRICITY_METER_DESCRIPTION)).toBeTruthy();
  expect(screen.getByText(OWN_ELECTRICITY_METER_ERROR)).toBeTruthy();
  expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
  fireEvent.press(screen.getByRole("checkbox"));
  expect(onSelectedChange).toHaveBeenCalledWith(true);
  screen.rerender(<ElectricityMeterConfirmation isSelected onSelectedChange={onSelectedChange} />);
  expect(screen.queryByText(OWN_ELECTRICITY_METER_ERROR)).toBeNull();
  fireEvent.press(screen.getByRole("checkbox"));
  expect(onSelectedChange).toHaveBeenLastCalledWith(false);
});

it("locks confirmation while saving", () => {
  const onSelectedChange = jest.fn();
  const screen = render(<ElectricityMeterConfirmation isSelected onSelectedChange={onSelectedChange} isDisabled />);
  fireEvent.press(screen.getByRole("checkbox"));
  expect(onSelectedChange).not.toHaveBeenCalled();
});

it("uses strict shared validation", () => {
  for (const value of [false, undefined, null, "true", 1]) {
    expect(getOwnElectricityMeterError(value)).toBe(OWN_ELECTRICITY_METER_ERROR);
  }
  expect(getOwnElectricityMeterError(true)).toBeUndefined();
});

it("shows the same label for a confirmed existing listing or preview, never unconfirmed data", () => {
  const apartment = { max_occupants: 2, floor_level: "Ground Floor", type: "Apartment", lease_duration: "1 year", has_own_electricity_meter: true } as ApartmentDetails;
  const screen = render(<ApartmentDetailsSection apartment={apartment} />);
  expect(screen.getByText(OWN_ELECTRICITY_METER_DETAIL)).toBeTruthy();
  screen.rerender(<ApartmentDetailsSection apartment={{ ...apartment, has_own_electricity_meter: false }} />);
  expect(screen.queryByText(OWN_ELECTRICITY_METER_DETAIL)).toBeNull();
  screen.rerender(<ApartmentDetailsSection apartment={null} />);
  expect(screen.queryByText(OWN_ELECTRICITY_METER_DETAIL)).toBeNull();
});

it("words the meter as electricity and water, and only for confirmed data", () => {
  expect(OWN_ELECTRICITY_METER_DETAIL).toBe("Own meter (electricity and water)");
  expect(OWN_ELECTRICITY_METER_FIELD_LABEL).toBe("Utility meters");
  expect(getOwnElectricityMeterDetail(true)).toBe(OWN_ELECTRICITY_METER_DETAIL);
  for (const value of [false, undefined, null, "true", 1]) {
    expect(getOwnElectricityMeterDetail(value)).toBeNull();
  }
  expect(OWN_ELECTRICITY_METER_CONFIRMATION).toMatch(/electricity and water meters/);
});
