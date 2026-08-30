import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Slider, Separator, RadioGroup, Radio, Label, Checkbox, ControlField, Input, TextField, Description, useToast } from "heroui-native";
import { CAMANAVA_CITIES, PETS, VEHICLE_OPTIONS } from "@repo/constants";
import { supabase } from "@repo/supabase";
import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import CityCheckBox from "@/app/(auth)/personalization/components/CityCheckBox";
import PersonalizationRadioButton from "@/app/(auth)/personalization/components/PersonalizationRadioButton";
import DropdownField from "components/inputs/DropdownField";
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from "@/hooks/auth/useCurrentUser";
import { parsePreferences } from "@/hooks/preferences/useUserPreferences";


const NO_PARKING_OPTIONS = Array.from({ length: 5 }, (_, i) => `${i + 1}`);
const BEDROOM_OPTIONS = ["1-2 Bedrooms", "2-4 Bedrooms", "4+ Bedrooms"];
const FAMILY_OPTIONS = ["Single", "Family of 2", "3 - 4 Persons", "5 - 6 Persons", "7+ Persons"];

export default function RentalPreferences() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profile } = useCurrentUser();

  const initialPrefs = useMemo(() => parsePreferences(profile?.preferences as any), [profile?.preferences]);

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState(5_000);
  const [budgetMax, setBudgetMax] = useState(100_000);
  const [bedroomCount, setBedroomCount] = useState<string | null>(null);
  const [householdSize, setHouseholdSize] = useState<string | null>(null);
  const [hasPets, setHasPets] = useState(false);
  const [kindOfPets, setKindOfPets] = useState("");
  const [nameOfPets, setNameOfPets] = useState<string | null>(null);
  const [hasParking, setHasParking] = useState(false);
  const [noOfParkingSpots, setNoOfParkingSpots] = useState(1);
  const [listOfVehicles, setListOfVehicles] = useState<string[]>([]);
  const [hasSmoker, setHasSmoker] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initialPrefs) return;
    setSelectedCities(initialPrefs.selectedCities);
    setBudgetMin(initialPrefs.budgetMin);
    setBudgetMax(initialPrefs.budgetMax);
    setBedroomCount(initialPrefs.bedroomCount);
    setHouseholdSize(initialPrefs.householdSize);
    setHasPets(initialPrefs.hasPets);
    setKindOfPets(initialPrefs.kindOfPets);
    setNameOfPets(initialPrefs.nameOfPets);
    setHasParking(initialPrefs.hasParking);
    setNoOfParkingSpots(initialPrefs.noOfParkingSpots);
    setListOfVehicles(initialPrefs.listOfVehicles);
    setHasSmoker(initialPrefs.hasSmoker);
    setHasDisability(initialPrefs.hasDisability);
  }, [initialPrefs]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };
  const toggleVehicle = (vehicle: string) => {
    setListOfVehicles((prev) => prev.includes(vehicle) ? prev.filter((v) => v !== vehicle) : [...prev, vehicle]);
  };

  const handleSave = async () => {
    if (!profile?.user_id) {
      toast.show({ variant: "danger", label: "Not signed in" });
      return;
    }
    setIsSaving(true);
    try {
      const preferences = {
        selectedCities,
        budgetMin,
        budgetMax,
        bedroomCount,
        householdSize,
        hasPets,
        kindOfPets,
        nameOfPets,
        hasParking,
        noOfParkingSpots,
        listOfVehicles,
        hasSmoker,
        hasDisability,
      };
      const { error } = await supabase.from("users").update({ preferences } as any).eq("user_id", profile.user_id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      toast.show({ variant: "success", label: "Preferences saved" });
      router.back();
    } catch (err: any) {
      console.error("Failed to save preferences", err);
      toast.show({ variant: "danger", label: "Couldn't save", description: err?.message ?? "Try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const cities = [...CAMANAVA_CITIES];

  return (
    <ScreenWrapper scrollable bottomPadding={32} header={<StandardHeader title="Rental Preferences" />} className="p-5">
      {/* Cities */}
      <Text className="text-secondary text-2xl font-nunitoMedium mb-2">Which city or area?</Text>
      <Text className="text-foreground text-base font-inter mb-4">Choose where you want to live. You can pick multiple CAMANAVA cities.</Text>
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {cities.map((city) => (
          <CityCheckBox key={city} cityName={city} selected={selectedCities.includes(city)} onPress={() => toggleCity(city)} />
        ))}
      </View>

      <Separator className="my-5" />

      {/* Budget */}
      <Text className="text-secondary text-2xl font-nunitoMedium mb-2">Got a budget?</Text>
      <Text className="text-foreground text-base font-inter mb-6">Select your preferred price range.</Text>
      <Text className="text-primary text-3xl font-nunitoBold text-center mb-6">₱ {budgetMin.toLocaleString()} - ₱ {budgetMax.toLocaleString()}</Text>
      <Slider value={[budgetMin, budgetMax]} onChange={(val) => { const [min, max] = val as number[]; setBudgetMin(min); setBudgetMax(max); }} minValue={5_000} maxValue={100_000} step={1_000}>
        <Slider.Track>
          {({ state }) => (
            <>
              <Slider.Fill />
              {state.values.map((_, i) => (
                <Slider.Thumb key={i} index={i} />
              ))}
            </>
          )}
        </Slider.Track>
      </Slider>

      <Separator className="my-5" />

      {/* Bedrooms */}
      <Text className="text-secondary text-2xl font-nunitoMedium mb-2">How many bedrooms?</Text>
      <Text className="text-foreground text-base font-inter mb-4">We’ll show places that fit.</Text>
      <View className="flex-row flex-wrap justify-between gap-y-1">
        {BEDROOM_OPTIONS.map((opt) => (
          <PersonalizationRadioButton key={opt} label={opt} selected={bedroomCount === opt} onPress={() => setBedroomCount(opt)} />
        ))}
      </View>

      <Separator className="my-5" />

      {/* Household */}
      <Text className="text-secondary text-2xl font-nunitoMedium mb-2">Household size</Text>
      <Text className="text-foreground text-base font-inter mb-4">Help us personalize for your household.</Text>
      <View className="flex-row flex-wrap justify-between">
        {FAMILY_OPTIONS.map((opt) => (
          <PersonalizationRadioButton key={opt} label={opt} selected={householdSize === opt} onPress={() => setHouseholdSize(opt)} />
        ))}
      </View>

      <Separator className="my-5" />

      {/* Pets */}
      <View className="flex gap-3">
        <Text className="text-foreground text-base font-nunitoSemiBold">Do you have any pets?</Text>
        <RadioGroup value={hasPets ? "yes" : "no"} onValueChange={(v) => { const val = v === "yes"; setHasPets(val); if (!val) { setKindOfPets(""); setNameOfPets(null); } }}>
          <RadioGroup.Item value="yes" className="flex-row items-center gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>Yes</Label></RadioGroup.Item>
          <RadioGroup.Item value="no" className="flex-row items-center gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>No</Label></RadioGroup.Item>
        </RadioGroup>
      </View>
      {hasPets && (
        <View className="mt-4">
          <DropdownField label="If yes, what kind of pet?" bottomSheetLabel="Select your Pet" placeholder="Select kind" options={PETS} onSelect={(v) => { setKindOfPets(v ?? ""); if (v !== "Other") setNameOfPets(null); }} value={kindOfPets} required />
        </View>
      )}
      {hasPets && kindOfPets === "Other" && (
        <View className="mt-4">
          <TextField isRequired><Label>Please specify</Label><Input placeholder="Type kind" value={nameOfPets || ""} onChangeText={setNameOfPets} /><Description>e.g., Poodle, Siamese</Description></TextField>
        </View>
      )}

      <Separator className="my-5" />

      {/* Parking */}
      <View className="flex gap-3">
        <Text className="text-foreground text-lg font-nunitoSemiBold">Do you need a parking space?</Text>
        <RadioGroup value={hasParking ? "yes" : "no"} onValueChange={(v) => { const val = v === "yes"; setHasParking(val); if (!val) { setListOfVehicles([]); } }}>
          <RadioGroup.Item value="yes" className="flex-row items-center gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>Yes</Label></RadioGroup.Item>
          <RadioGroup.Item value="no" className="flex-row items-center gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>No</Label></RadioGroup.Item>
        </RadioGroup>
      </View>
      {hasParking && (
        <View className="mt-4">
          <DropdownField label="How many spots?" bottomSheetLabel="Select Parking" placeholder="Select number" options={NO_PARKING_OPTIONS} onSelect={(v) => setNoOfParkingSpots(v ? Number(v) : 1)} value={String(noOfParkingSpots)} required />
        </View>
      )}
      {hasParking && noOfParkingSpots > 0 && (
        <View className="flex gap-3 mt-4">
          <Text className="text-foreground text-base font-nunitoSemiBold">Kinds of vehicles</Text>
          {VEHICLE_OPTIONS.map((vehicle) => (
            <ControlField key={vehicle} isSelected={listOfVehicles.includes(vehicle)} onSelectedChange={() => toggleVehicle(vehicle)}>
              <ControlField.Indicator><Checkbox className="border border-border shadow-none" /></ControlField.Indicator><Label>{vehicle}</Label>
            </ControlField>
          ))}
        </View>
      )}

      <Separator className="my-5" />

      {/* Smoker */}
      <View className="flex gap-3">
        <Text className="text-foreground text-lg font-nunitoSemiBold">Is anyone a smoker?</Text>
        <RadioGroup value={hasSmoker ? "yes" : "no"} onValueChange={(v) => setHasSmoker(v === "yes")}>
          <RadioGroup.Item value="yes" className="flex-row gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>Yes</Label></RadioGroup.Item>
          <RadioGroup.Item value="no" className="flex-row gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>No</Label></RadioGroup.Item>
        </RadioGroup>
      </View>

      <Separator className="my-5" />

      {/* Disability */}
      <View className="flex gap-3">
        <Text className="text-foreground text-lg font-nunitoSemiBold">Household members with disability?</Text>
        <RadioGroup value={hasDisability ? "yes" : "no"} onValueChange={(v) => setHasDisability(v === "yes")}>
          <RadioGroup.Item value="yes" className="flex-row gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>Yes</Label></RadioGroup.Item>
          <RadioGroup.Item value="no" className="flex-row gap-2"><Radio><Radio.Indicator className="border border-border shadow-none rounded-full" /></Radio><Label>No</Label></RadioGroup.Item>
        </RadioGroup>
      </View>

      <View className="mt-8">
        <Button onPress={handleSave} isDisabled={isSaving}>
          <Button.Label>{isSaving ? "Saving..." : "Save preferences"}</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
