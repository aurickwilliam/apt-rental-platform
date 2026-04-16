import { View, Text, Dimensions } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

import { COLORS } from '@repo/constants';

function SliderThumb() {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        // Raised shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
        // Inner white dot
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
  
const SLIDER_WIDTH  = Dimensions.get('window').width - 40; 

export default function RangeSlider({
  label,
  min,
  max,
  values,
  step,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  values: [number, number];
  step: number;
  onChange: (vals: [number, number]) => void;
  format: (v: number) => string;
}) {
  return (
    <View>
      {/* Label + range display */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="font-poppinsMedium text-base text-text mb-3">
          {label}
        </Text>
        <Text className="font-poppinsMedium text-[13px] text-primary">
          {format(values[0])} – {format(values[1])}
        </Text>
      </View>

      {/* Track labels */}
      <View className="flex-row justify-between mb-1 px-1">
        <Text className="font-[Poppins_400Regular] text-[11px] text-[#AAAAAA]">
          {format(min)}
        </Text>
        <Text className="font-[Poppins_400Regular] text-[11px] text-[#AAAAAA]">
          {format(max)}
        </Text>
      </View>

      {/* Dual-handle slider */}
      <View style={{ alignItems: 'center' }}>
        <MultiSlider
          values={[values[0], values[1]]}
          min={min}
          max={max}
          step={step}
          sliderLength={SLIDER_WIDTH}
          onValuesChange={(vals) => onChange([vals[0], vals[1]])}
          selectedStyle={{ backgroundColor: COLORS.primary, height: 6, borderRadius: 3 }}
          unselectedStyle={{ backgroundColor: '#E0E0E0', height: 6, borderRadius: 3 }}
          containerStyle={{ height: 48 }}
          trackStyle={{ height: 6, borderRadius: 3 }}
          customMarker={SliderThumb}
          allowOverlap={false}
          snapped
        />
      </View>
    </View>
  );
}