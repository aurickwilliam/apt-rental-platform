import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import DateField from "@/components/inputs/DateField";
import TimeField from "@/components/inputs/TimeField";
import QuantityField from "@/components/inputs/QuantityField";

import { useApartmentDetails } from "@/hooks/apartments";
import { useSubmitVisitRequest } from "@/hooks/visitRequests";

import {
  Button,
  Separator,
  TextField,
  Label,
  TextArea,
  useToast,
} from "heroui-native";

export default function RequestVisit() {
  const { toast } = useToast();
  const router = useRouter();

  const { apartmentId, applicationId } = useLocalSearchParams<{
    apartmentId: string;
    applicationId: string;
  }>();

  const { apartment } = useApartmentDetails(apartmentId);
  const { submitVisitRequest, loading, error } = useSubmitVisitRequest();

  const [visitDetails, setVisitDetails] = useState({
    date: null as Date | null,
    hour: "",
    period: "AM" as "AM" | "PM",
    noVisitors: 1,
    notes: "",
  });

  const [errors, setErrors] = useState({
    date: false,
    hour: false,
  });

  const handleSubmitRequestVisit = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(visitDetails.date!);
    selected.setHours(0, 0, 0, 0);

    const newErrors = {
      date: !visitDetails.date || selected <= today,
      hour: !visitDetails.hour,
    };

    setErrors(newErrors);

    if (newErrors.date || newErrors.hour) return;

    if (!apartment?.landlord?.id) {
      toast.show({
        variant: "danger",
        label: "Unable to find landlord. Please try again.",
      });
      return;
    }

    const { success } = await submitVisitRequest({
      apartmentId,
      applicationId,
      landlordId: apartment.landlord.id,
      date: visitDetails.date!,
      hour: visitDetails.hour,
      period: visitDetails.period,
      noVisitors: visitDetails.noVisitors,
      notes: visitDetails.notes,
    });

    if (success) {
      toast.show({
        variant: "success",
        label: "Visit request submitted!"
      });
      router.back();
    } else {
      toast.show({
        variant: "danger",
        label: error ?? "Something went wrong. Please try again.",
      });
    }
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
              onChange={(date) => {
                setVisitDetails((prev) => ({ ...prev, date }));
                setErrors((prev) => ({ ...prev, date: false }));
              }}
              placeholder="Select date..."
              required
              error={
                errors.date
                  ? !visitDetails.date
                    ? "Please select a visit date."
                    : "Visit date must be at least a day from today."
                  : undefined
              }
            />

            <Separator />

            {/* Time of Visit */}
            <TimeField
              required
              label="Preferred Visit Time:"
              hour={visitDetails.hour}
              period={visitDetails.period}
              onHourChange={(hour) => {
                setVisitDetails((prev) => ({ ...prev, hour }));
                setErrors((prev) => ({ ...prev, hour: false }));
              }}
              onPeriodChange={(period) =>
                setVisitDetails((prev) => ({ ...prev, period }))
              }
              isInvalid={errors.hour}
            />

            <Separator />

            {/* Number of Visitors */}
            <QuantityField
              required
              label="Number of Visitors:"
              value={visitDetails.noVisitors}
              onChange={(noVisitors) =>
                setVisitDetails((prev) => ({ ...prev, noVisitors }))
              }
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

        <Button onPress={handleSubmitRequestVisit} isDisabled={loading}>
          <Button.Label>
            {loading ? "Requesting..." : "Submit Visit Request"}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
