import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Slider,
  Separator,
  Label,
  Input,
  TextField,
  Description,
  useToast,
  ListGroup,
  Switch,
} from "heroui-native";
import { CAMANAVA_CITIES, PETS, VEHICLE_OPTIONS } from "@repo/constants";
import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import DropdownButton from "components/buttons/DropdownButton";
import { useRentalPreferencesForm } from "@/hooks/preferences/useRentalPreferencesForm";
import { useColors } from "@/hooks/useTheme";
import {
  IconMapPin,
  IconCoin,
  IconBed,
  IconUsersGroup,
  IconPaw,
  IconParking,
  IconSmoking,
  IconAccessible,
  IconHome,
  IconUser,
} from "@tabler/icons-react-native";

const BEDROOM_OPTIONS = ["1-2 Bedrooms", "2-4 Bedrooms", "4+ Bedrooms"] as const;
const FAMILY_OPTIONS = ["Single", "Family of 2", "3 - 4 Persons", "5 - 6 Persons", "7+ Persons"] as const;
const NO_PARKING_OPTIONS = ["1", "2", "3", "4", "5"] as const;

export default function RentalPreferences() {
  const router = useRouter();
  const { toast } = useToast();
  const { colors } = useColors();
  const {
    profile,
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
    isSaving,
    isDirty,
    setBudgetRange,
    setBedroomCount,
    setHouseholdSize,
    setHasPets,
    setKindOfPets,
    setNameOfPets,
    setHasParking,
    setNoOfParkingSpots,
    setHasSmoker,
    setHasDisability,
    toggleCity,
    toggleVehicle,
    save,
  } = useRentalPreferencesForm();

  const cities = ["CAMANAVA", ...CAMANAVA_CITIES] as unknown as string[];

  const handleCityToggle = (city: string) => {
    if (city === "CAMANAVA") {
      const allSelected = cities.slice(1).every((c) => selectedCities.includes(c));
      if (allSelected) {
        // Clear all - empty means all CAMANAVA
        cities.slice(1).forEach((c) => {
          if (selectedCities.includes(c)) toggleCity(c);
        });
      } else {
        cities.slice(1).forEach((c) => {
          if (!selectedCities.includes(c)) toggleCity(c);
        });
      }
      return;
    }
    toggleCity(city);
  };

  const cityValues = (() => {
    const allCities = cities.slice(1);
    const allSelected = allCities.length > 0 && allCities.every((c) => selectedCities.includes(c));
    if (allSelected && selectedCities.length === allCities.length) return ["CAMANAVA"];
    return selectedCities;
  })();

  const handleSave = async () => {
    if (!profile?.user_id) {
      toast.show({ variant: "danger", label: "Not signed in" });
      return;
    }
    try {
      await save();
      toast.show({ variant: "success", label: "Preferences saved" });
      router.back();
    } catch (err: any) {
      console.error("Failed to save preferences", err);
      toast.show({ variant: "danger", label: "Couldn't save", description: err?.message ?? "Try again." });
    }
  };

  const handleBudgetChange = (val: number | number[]) => {
    const [min, max] = val as number[];
    setBudgetRange(min, max);
  };

  return (
    <ScreenWrapper scrollable bottomPadding={32} header={<StandardHeader title="Rental Preferences" />} className="p-5 gap-5">
      {/* Location */}
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <IconMapPin size={18} color={colors.textPrimary} />
          <Text className="text-foreground text-base font-inter">Location</Text>
        </View>
        <ListGroup className="shadow-none border border-border">
          <View className="p-4 gap-3">
            <Text className="text-foreground text-sm font-inter">Preferred cities</Text>
            <DropdownButton
              multi
              values={cityValues}
              options={cities}
              value={null}
              onSelect={() => {}}
              onToggle={handleCityToggle}
              placeholder="All CAMANAVA"
              label="Select cities"
              width={280}
              buttonClassName="bg-surface border border-border px-3 py-2.5 rounded-xl flex-row items-center justify-between w-full gap-2"
              textClassName="text-foreground text-sm font-inter flex-1"
            />
          </View>
        </ListGroup>
      </View>

      {/* Budget - dedicated ListGroup with Slider */}
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <IconCoin size={18} color={colors.textPrimary} />
          <Text className="text-foreground text-base font-inter">Budget</Text>
        </View>
        <ListGroup className="shadow-none border border-border">
          <View className="p-4 gap-3">
            <Text className="text-foreground text-sm font-inter">Monthly budget</Text>
            <Text className="text-muted text-xs font-inter">Used to rank listings. Max stays ₱100,000.</Text>
            <Text className="text-primary text-2xl font-nunitoBold text-center">₱ {budgetMin.toLocaleString()} — ₱ {budgetMax.toLocaleString()}</Text>
            <Slider value={[budgetMin, budgetMax]} onChange={handleBudgetChange as any} minValue={5_000} maxValue={100_000} step={1_000}>
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
            <View className="flex-row justify-between">
              <Text className="text-muted text-xs font-inter">₱5,000</Text>
              <Text className="text-muted text-xs font-inter">₱100,000</Text>
            </View>
          </View>
        </ListGroup>
      </View>

      {/* Home */}
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <IconHome size={18} color={colors.textPrimary} />
          <Text className="text-foreground text-base font-inter">Home</Text>
        </View>
        <ListGroup className="shadow-none border border-border">
          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconBed size={20} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="font-inter">Bedrooms</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <DropdownButton
                value={bedroomCount}
                options={[...BEDROOM_OPTIONS]}
                onSelect={(v) => setBedroomCount(v)}
                placeholder="Select"
                label="Bedrooms"
                width={200}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconUsersGroup size={20} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="font-inter">Household size</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <DropdownButton
                value={householdSize}
                options={[...FAMILY_OPTIONS]}
                onSelect={(v) => setHouseholdSize(v)}
                placeholder="Select"
                label="Household size"
                width={240}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconParking size={20} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="font-inter">Need parking?</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch isSelected={hasParking} onSelectedChange={setHasParking} />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          {hasParking && (
            <>
              <Separator className="mx-4" />
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="font-inter">Parking spots</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <DropdownButton
                    value={String(noOfParkingSpots)}
                    options={[...NO_PARKING_OPTIONS]}
                    onSelect={(v) => setNoOfParkingSpots(Number(v))}
                    placeholder="Select"
                    label="Parking spots"
                    width={160}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>

              <Separator className="mx-4" />

              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="font-inter">Vehicles</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-xs font-inter">Multi-select</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <DropdownButton
                    multi
                    values={listOfVehicles}
                    options={[...VEHICLE_OPTIONS] as string[]}
                    value={null}
                    onSelect={() => {}}
                    onToggle={toggleVehicle}
                    placeholder="Select"
                    label="Vehicles"
                    width={200}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </>
          )}
        </ListGroup>
      </View>

      {/* Lifestyle */}
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <IconUser size={18} color={colors.textPrimary} />
          <Text className="text-foreground text-base font-inter">Lifestyle</Text>
        </View>
        <ListGroup className="shadow-none border border-border">
          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconPaw size={20} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="font-inter">Have pets?</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch isSelected={hasPets} onSelectedChange={setHasPets} />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          {hasPets && (
            <>
              <Separator className="mx-4" />
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="font-inter">What kind of pet?</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <DropdownButton
                    value={kindOfPets || null}
                    options={[...PETS] as string[]}
                    onSelect={(v) => setKindOfPets(v)}
                    placeholder="Select"
                    label="Pet kind"
                    width={220}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>

              {kindOfPets === "Other" && (
                <>
                  <Separator className="mx-4" />
                  <View className="p-4">
                    <TextField isRequired>
                      <Label className="font-inter">Please specify</Label>
                      <Input placeholder="Type kind" value={nameOfPets || ""} onChangeText={setNameOfPets} />
                      <Description className="font-inter">e.g., Poodle, Siamese</Description>
                    </TextField>
                  </View>
                </>
              )}
            </>
          )}

          <Separator className="mx-4" />

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconSmoking size={20} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="font-inter">Anyone a smoker?</ListGroup.ItemTitle>
              <ListGroup.ItemDescription className="text-xs font-inter">Helps match non-smoking listings</ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch isSelected={hasSmoker} onSelectedChange={setHasSmoker} />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconAccessible size={20} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="font-inter">Accessibility needs?</ListGroup.ItemTitle>
              <ListGroup.ItemDescription className="text-xs font-inter">Prioritize wheelchair-friendly</ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch isSelected={hasDisability} onSelectedChange={setHasDisability} />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>
      </View>

      {/* Save - only when dirty */}
      {isDirty && (
        <View className="gap-3 mt-2">
          <Button onPress={handleSave} isDisabled={isSaving}>
            <Button.Label>{isSaving ? "Saving..." : "Save changes"}</Button.Label>
          </Button>
          <Text className="text-muted text-xs font-inter text-center">Changes personalize your search instantly after saving.</Text>
        </View>
      )}
    </ScreenWrapper>
  );
}
