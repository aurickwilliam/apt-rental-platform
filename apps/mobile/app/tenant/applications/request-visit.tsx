import { View, Text } from "react-native";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import DateField from "@/components/inputs/DateField";

import { useColors } from "hooks/useTheme";

import {
  Button,
  Separator,
  TextField,
  Label,
  TextArea,
  Select,
  Slider,
} from "heroui-native";
import TimeField from "@/components/inputs/TimeField";
import QuantityField from "@/components/inputs/QuantityField";

type VisitDetails = {
  date: Date | null;
  time: string;
  noVisitors: number;
  notes: string;
};

const TIME_OPTIONS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
];

export default function RequestVisit() {
  const { colors } = useColors();

  const [visitDetails, setVisitDetails] = useState({
    date: null as Date | null,
    hour: "",
    period: "AM" as "AM" | "PM",
    noVisitors: 1,
    notes: "",
  });

  const handleSubmitRequestVisit = () => {
    console.log("Request Visit Submitted", visitDetails);
  };

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Request a Visit" />}
      className="p-5"
    >
      <View className="flex-1 justify-between">
        <View className="flex-1">
          {/* Description */}
          <Text className="text-foreground text-base font-inter">
            Choose your preferred date and time to schedule a visit. The
            landlord will confirm your request as soon as possible.
          </Text>

          <View className="flex-1 gap-6 mt-8">
            {/* Date */}
            <DateField
              label="Preferred Visit Date:"
              value={visitDetails.date}
              onChange={(date) =>
                setVisitDetails((prev) => ({ ...prev, date }))
              }
              placeholder="Select date..."
              required
            />

            <Separator />

            {/* Time of Visit */}
            <TimeField
              label="Preferred Visit Time:"
              hour={visitDetails.hour}
              period={visitDetails.period}
              onHourChange={(hour) => setVisitDetails((prev) => ({ ...prev, hour }))}
              onPeriodChange={(period) => setVisitDetails((prev) => ({ ...prev, period }))}
            />

            <Separator />

            {/* Number of Visitors */}
            <QuantityField
              label="Number of Visitors:"
              value={visitDetails.noVisitors}
              onChange={(noVisitors) => setVisitDetails((prev) => ({ ...prev, noVisitors }))}
              unit={["person", "people"]}
            />

            <Separator />

            {/* Notes */}
            <View className="pb-24">
              <TextField>
                <Label>Additional Notes (Optional)</Label>
                <TextArea
                  className="p-3"
                  placeholder="Any specific questions or requests for the landlord?"
                  value={visitDetails.notes}
                  onChangeText={(notes) =>
                    setVisitDetails((prev) => ({ ...prev, notes }))
                  }
                />
              </TextField>
            </View>
          </View>
        </View>

        <Button onPress={handleSubmitRequestVisit}>
          <Button.Label>Request a Visit</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}