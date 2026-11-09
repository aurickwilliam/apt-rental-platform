import { ScrollView } from 'react-native';
import { Chip } from 'heroui-native';

const ALL_CITIES = 'CAMANAVA';

type CityChipsProps = {
  /** CAMANAVA (all cities) first, then each city. */
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
};

/**
 * Quick city switch under the search field: "All cities" plus each CAMANAVA
 * city, one at a time. Choosing the current city again goes back to all cities.
 * It bleeds to the screen edges and scrolls sideways.
 */
export default function CityChips({ cities, selectedCity, onSelectCity }: CityChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      accessibilityLabel='Filter by city'
      className='-mx-5'
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {cities.map((city) => {
        const isSelected = city === selectedCity;
        const label = city === ALL_CITIES ? 'All cities' : city;
        return (
          <Chip
            key={city}
            variant={isSelected ? 'primary' : 'secondary'}
            color={isSelected ? 'accent' : 'default'}
            onPress={() => onSelectCity(isSelected ? ALL_CITIES : city)}
            accessibilityRole='button'
            accessibilityState={{ selected: isSelected }}
          >
            <Chip.Label>{label}</Chip.Label>
          </Chip>
        );
      })}
    </ScrollView>
  );
}
