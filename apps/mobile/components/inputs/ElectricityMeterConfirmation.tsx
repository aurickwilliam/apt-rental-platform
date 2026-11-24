import { View } from "react-native";
import { Checkbox, ControlField, Description, FieldError, Label } from "heroui-native";
import {
  OWN_ELECTRICITY_METER_CONFIRMATION,
  OWN_ELECTRICITY_METER_DESCRIPTION,
} from "@repo/constants";

interface ElectricityMeterConfirmationProps {
  isSelected: boolean;
  onSelectedChange: (selected: boolean) => void;
  error?: string;
  isDisabled?: boolean;
}

export default function ElectricityMeterConfirmation({
  isSelected, onSelectedChange, error, isDisabled,
}: ElectricityMeterConfirmationProps) {
  return (
    <ControlField isSelected={isSelected} onSelectedChange={onSelectedChange} isInvalid={!!error} isDisabled={isDisabled} className="items-start">
      <ControlField.Indicator>
        <Checkbox className="mt-0.5" />
      </ControlField.Indicator>
      <View className="flex-1">
        <Label isRequired>{OWN_ELECTRICITY_METER_CONFIRMATION}</Label>
        <Description>{OWN_ELECTRICITY_METER_DESCRIPTION}</Description>
        {error ? <FieldError>{error}</FieldError> : null}
      </View>
    </ControlField>
  );
}
